// functions/src/missionreport/generateFullMissionReport.js

// ---- Firebase Functions v2 (callable) ----
const { onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

// ---- Firebase Admin ----
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// ---- Anthropic (Claude) ----
const Anthropic = require("@anthropic-ai/sdk");

// ---- Node stdlib ----
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Initialize Admin once
initializeApp();

// Secrets (already configured in your project)
const ANTHROPIC_KEY = defineSecret("ANTHROPIC_KEY");

// Optional: mirror teammate region by setting the same region in your env or just let defaults apply
const REGION = process.env.FUNCTIONS_REGION || "us-central1";

// Load contract template once at cold start
const CONTRACT_PATH = path.join(
  __dirname,
  "contracts",
  "test_monkey_full_report_payload_v2.txt"
);
const CONTRACT_TEMPLATE = fs.readFileSync(CONTRACT_PATH, "utf8");

// Helper: simple JSON-safe replace of placeholders in the template
function populateTemplate(templateStr, vars) {
  // We expect placeholders like {{SURVEY_QUESTIONS}} and {{TESTER_RESPONSES}}
  return templateStr
    .replace("{{SURVEY_QUESTIONS}}", JSON.stringify(vars.SURVEY_QUESTIONS))
    .replace("{{TESTER_RESPONSES}}", JSON.stringify(vars.TESTER_RESPONSES));
}

// Helper: make a stable, trimmed copy of questions array without empties
function normalizeQuestions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((q) => (typeof q === "string" ? q.trim() : ""))
    .filter((q) => q.length > 0);
}

// Helper: align one submission’s answers to the questions order
function alignResponsesToQuestions(questions, submissionAnswers) {
  // submissionAnswers: [{ question, answer }, ...]
  const map = new Map();
  if (Array.isArray(submissionAnswers)) {
    for (const entry of submissionAnswers) {
      const q = (entry?.question || "").trim();
      const a = typeof entry?.answer === "string" ? entry.answer : "";
      if (q) map.set(q, a);
    }
  }
  // For each mission question in order, grab matching answer or ""
  return questions.map((q) => map.get(q) || "");
}

// Helper: very lightweight validator to ensure shape is sane
function validateSections(sections) {
  if (!sections || typeof sections !== "object") {
    throw new Error("AI response missing top-level sections object");
  }
  const s1 = sections.section_1_sentiment_analysis;
  const s2 = sections.section_2_scoring_and_pain_points;
  const s3 = sections.section_3_actionable_steps_and_ranking;
  const s4 = sections.section_4_review_by_questions;

  if (!s1 || !s2 || !s3 || !s4) {
    throw new Error("AI response missing one or more required sections");
  }

  // Scoring should have exactly 4 areas (we only check count existence)
  if (!Array.isArray(s2.areas) || s2.areas.length !== 4) {
    throw new Error("Scoring & pain points must include exactly 4 areas");
  }

  // Actionable steps: 3 high, 3 medium, 2 low (check minimal presence)
  const hs = Array.isArray(s3.high) ? s3.high.length : 0;
  const ms = Array.isArray(s3.medium) ? s3.medium.length : 0;
  const ls = Array.isArray(s3.low) ? s3.low.length : 0;
  if (hs !== 3 || ms !== 3 || ls !== 2) {
    throw new Error("Actionable steps must be 3 high, 3 medium, 2 low");
  }

  // Review by questions should be an array with per-question summaries and answers
  if (!Array.isArray(s4.questions) || s4.questions.length === 0) {
    throw new Error("Review by questions must include at least one question");
  }
}

// Helper: simple hash of questions for traceability
function hashQuestions(questions) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(questions))
    .digest("hex")
    .slice(0, 16); // short hash for convenience
}

exports.generateFullMissionReport = onCall(
  { region: REGION, secrets: [ANTHROPIC_KEY], cors: true },
  async (request) => {
    try {
      const db = getFirestore();

      // ---- Input validation ----
      const missionId = request?.data?.missionId;
      if (!missionId || typeof missionId !== "string") {
        throw new Error("missionId (string) is required");
      }

      // ---- Read mission (questions) ----
      const missionRef = db.collection("Missions").doc(missionId);
      const missionSnap = await missionRef.get();
      if (!missionSnap.exists) {
        throw new Error(`Mission ${missionId} not found`);
      }
      const mission = missionSnap.data();
      const SURVEY_QUESTIONS = normalizeQuestions(mission?.questions || []);

      // ---- Read submissions for mission ----
      const subsSnap = await db
        .collection("Submissions")
        .where("missionId", "==", missionId)
        .get();

      const submissions = subsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const sourceSubmissionCount = submissions.length;

      // ---- Build TESTER_RESPONSES aligned to SURVEY_QUESTIONS ----
      const TESTER_RESPONSES = submissions.map((s) => {
        const responses = alignResponsesToQuestions(
          SURVEY_QUESTIONS,
          s?.answers || []
        );
        return {
          tester_id: s?.testerId || "",
          tester_name: s?.testerName || "",
          responses,
        };
      });

      // ---- Populate contract template (server-side) ----
      const contractBody = populateTemplate(CONTRACT_TEMPLATE, {
        SURVEY_QUESTIONS,
        TESTER_RESPONSES,
      });

      // ---- Call Claude (Anthropic) ----
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_KEY,
      });

      const model = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022";

      const aiResp = await anthropic.messages.create({
        model,
        max_tokens: 4000,
        system:
          "You are a strict API that returns ONLY valid JSON matching the requested schema. No prose, no markdown.",
        messages: [
          {
            role: "user",
            content: contractBody,
          },
        ],
      });

      const raw = aiResp?.content?.[0]?.text || "";
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        // Attempt to extract JSON if model wrapped anything (shouldn't, but be safe)
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        if (start >= 0 && end > start) {
          parsed = JSON.parse(raw.slice(start, end + 1));
        } else {
          throw new Error("AI response was not valid JSON");
        }
      }

      // ---- Validate sections shape (light) ----
      validateSections(parsed);

      // ---- Persist report (append-only) ----
      const questionsHash = hashQuestions(SURVEY_QUESTIONS);
      const reportRef = await missionRef.collection("reports").add({
        ai_output_json: parsed,
        generatedAt: FieldValue.serverTimestamp(),
        sourceSubmissionCount,
        questionsHash,
        model,
      });

      // We’ll read back server timestamp so client can show it immediately
      const saved = await reportRef.get();
      const savedData = saved.data();
      const generatedAt =
        savedData?.generatedAt?.toDate?.().toISOString?.() || null;

      return {
        success: true,
        reportId: reportRef.id,
        generatedAt,
        sourceSubmissionCount,
        sections: parsed,
      };
    } catch (err) {
      console.error("generateFullMissionReport error:", err);
      // Surface a simple, user-friendly message
      throw new Error(
        err?.message || "Failed to generate mission full report. Please try again."
      );
    }
  }
);
