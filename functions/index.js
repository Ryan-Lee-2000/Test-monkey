import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import { Anthropic } from "@anthropic-ai/sdk";
import admin from "firebase-admin";
import nodemailer from "nodemailer"; 
import crypto from "crypto";

admin.initializeApp();
const db = admin.firestore();
const { FieldValue } = admin.firestore;
const anthropicKey = defineSecret("ANTHROPIC_KEY");
const emailUser = defineSecret("EMAIL_USER");
const emailPassword = defineSecret("EMAIL_PASSWORD");

const CONTRACT_TEMPLATE = `
{
  "survey_questions": {{SURVEY_QUESTIONS}},
  "tester_responses": {{TESTER_RESPONSES}},
  "task": "You are an API that MUST return ONLY valid JSON (no markdown, no prose) conforming exactly to the schema below. Use the provided survey_questions (ordered) and tester_responses (aligned to those questions; empty strings mean skipped). Aggregate all responses and produce exactly four top-level sections. Do not add, rename, or remove keys. Do not include null. Use empty strings where needed. Ensure all arrays have the exact required lengths.\\n\\nREQUIRED OUTPUT SCHEMA (return exactly this top-level shape):\\n{\\n  \\"section_1_sentiment_analysis\\": {\\n    \\"overall_summary\\": \\"<short paragraph>\\",\\n    \\"distribution\\": {\\n      \\"positive_percent\\": <number>,\\n      \\"neutral_percent\\": <number>,\\n      \\"negative_percent\\": <number>\\n    }\\n  },\\n  \\"section_2_scoring_and_pain_points\\": {\\n    \\"areas\\": [\\n      { \\"area\\": \\"Navigation\\",        \\"score_1_to_5\\": <integer 1-5>, \\"stars\\": \\"<1-5 black stars>\\", \\"comment\\": \\"<one-liner>\\" },\\n      { \\"area\\": \\"Layout clarity\\",    \\"score_1_to_5\\": <integer 1-5>, \\"stars\\": \\"<1-5 black stars>\\", \\"comment\\": \\"<one-liner>\\" },\\n      { \\"area\\": \\"Functionality\\",     \\"score_1_to_5\\": <integer 1-5>, \\"stars\\": \\"<1-5 black stars>\\", \\"comment\\": \\"<one-liner>\\" },\\n      { \\"area\\": \\"Visual appeal\\",     \\"score_1_to_5\\": <integer 1-5>, \\"stars\\": \\"<1-5 black stars>\\", \\"comment\\": \\"<one-liner>\\" }\\n    ]\\n  },\\n  \\"section_3_actionable_steps_and_ranking\\": {\\n    \\"high\\":   [ { \\"action\\": \\"<concise>\\", \\"rationale\\": \\"<why>\\", \\"impact\\": \\"High\\",   \\"effort\\": \\"<Low|Medium|High>\\" }, { \\"action\\": \\"<concise>\\", \\"rationale\\": \\"<why>\\", \\"impact\\": \\"High\\",   \\"effort\\": \\"<Low|Medium|High>\\" }, { \\"action\\": \\"<concise>\\", \\"rationale\\": \\"<why>\\", \\"impact\\": \\"High\\",   \\"effort\\": \\"<Low|Medium|High>\\" } ],\\n    \\"medium\\": [ { \\"action\\": \\"<concise>\\", \\"rationale\\": \\"<why>\\", \\"impact\\": \\"Medium\\", \\"effort\\": \\"<Low|Medium|High>\\" }, { \\"action\\": \\"<concise>\\", \\"rationale\\": \\"<why>\\", \\"impact\\": \\"Medium\\", \\"effort\\": \\"<Low|Medium|High>\\" }, { \\"action\\": \\"<concise>\\", \\"rationale\\": \\"<why>\\", \\"impact\\": \\"Medium\\", \\"effort\\": \\"<Low|Medium|High>\\" } ],\\n    \\"low\\":    [ { \\"action\\": \\"<concise>\\", \\"rationale\\": \\"<why>\\", \\"impact\\": \\"Low\\",    \\"effort\\": \\"<Low|Medium|High>\\" }, { \\"action\\": \\"<concise>\\", \\"rationale\\": \\"<why>\\", \\"impact\\": \\"Low\\",    \\"effort\\": \\"<Low|Medium|High>\\" } ]\\n  },\\n  \\"section_4_review_by_questions\\": {\\n    \\"questions\\": [\\n      {\\n        \\"question_text\\": \\"<exact text from survey_questions[i]>\\",\\n        \\"short_summary\\": \\"<1-2 sentence synthesis>\\",\\n        \\"answers\\": [ { \\"tester_id\\": \\"<id>\\", \\"tester_name\\": \\"<name>\\", \\"answer\\": \\"<string (may be empty)>\\" } ]\\n      }\\n    ]\\n  }\\n}\\n\\nRULES:\\n- Use exactly four top-level keys as shown.\\n- In section_2, provide exactly 4 areas in the order specified.\\n- In section_3, provide exactly 3 items in \\"high\\", 3 items in \\"medium\\", and 2 items in \\"low\\"; within each, order from most impactful to least.\\n- In section_4, include one entry per survey question (in order). Each \\"answers\\" must include every tester from tester_responses, with their answer aligned to that question index (use empty string if skipped).\\n- Percent values in distribution should sum to ~100 (allow rounding).\\n- Return ONLY the JSON object — no code fences, no extra commentary."
}
`;

// --- Helpers ---
function normalizeQuestions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((q) => (typeof q === "string" ? q.trim() : ""))
    .filter((q) => q.length > 0);
}

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
  return questions.map((q) => map.get(q) || "");
}

function populateTemplate(templateStr, vars) {
  // placeholders: {{SURVEY_QUESTIONS}} and {{TESTER_RESPONSES}}
  return templateStr
    .replace("{{SURVEY_QUESTIONS}}", JSON.stringify(vars.SURVEY_QUESTIONS))
    .replace("{{TESTER_RESPONSES}}", JSON.stringify(vars.TESTER_RESPONSES));
}

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

  // exactly 4 areas
  if (!Array.isArray(s2.areas) || s2.areas.length !== 4) {
    throw new Error("Scoring & pain points must include exactly 4 areas");
  }

  // 3/3/2 items
  const hs = Array.isArray(s3.high) ? s3.high.length : 0;
  const ms = Array.isArray(s3.medium) ? s3.medium.length : 0;
  const ls = Array.isArray(s3.low) ? s3.low.length : 0;
  if (hs !== 3 || ms !== 3 || ls !== 2) {
    throw new Error("Actionable steps must be 3 high, 3 medium, 2 low");
  }

  // per-question array present
  if (!Array.isArray(s4.questions) || s4.questions.length === 0) {
    throw new Error("Review by questions must include at least one question");
  }
}

function hashQuestions(questions) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(questions))
    .digest("hex")
    .slice(0, 16);
}




const corsOptions = {
  origin: true, // Allow all origins in development
  credentials: true,
};

// Email verification helpers
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendMissionCompleteEmail(founderEmail, founderName, missionName, missionId) {
  logger.info(`Sending mission completion email to ${founderEmail}`);

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser.value(),
        pass: emailPassword.value()
      }
    });

    // Use Vercel deployment URL
    const appUrl = process.env.APP_URL || 'https://test-monkey-liard.vercel.app';
    const reportUrl = `${appUrl}`;

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #0A490A 0%, #0f5a0f 100%); border-radius: 12px 12px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🐵 Test Monkey</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px 0; color: #0A490A; font-size: 24px;">Mission Complete! 🎉</h2>
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                      Hi ${founderName || 'there'},
                    </p>
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                      Great news! Your mission "<strong>${missionName}</strong>" has been completed by all testers. Your detailed report is now ready to view.
                    </p>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${reportUrl}" style="display: inline-block; background: linear-gradient(135deg, #0A490A 0%, #0f5a0f 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                        View Your Report
                      </a>
                    </div>

                    <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                      The report includes:
                    </p>
                    <ul style="color: #666666; font-size: 14px; line-height: 1.8;">
                      <li>Sentiment analysis from all testers</li>
                      <li>Scoring across key areas</li>
                      <li>Actionable improvement steps</li>
                      <li>Detailed feedback by question</li>
                    </ul>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
                    <p style="margin: 0; color: #999999; font-size: 12px;">
                      © ${new Date().getFullYear()} Test Monkey. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Test Monkey" <${emailUser.value()}>`,
      to: founderEmail,
      subject: `Mission Complete: ${missionName} - Test Monkey 🎉`,
      html: htmlTemplate,
      text: `Hi ${founderName || 'there'},\n\nGreat news! Your mission "${missionName}" has been completed by all testers.\n\nYour detailed report is now ready to view at: ${reportUrl}\n\nThe report includes sentiment analysis, scoring, actionable steps, and detailed feedback.\n\n© ${new Date().getFullYear()} Test Monkey`
    });

    logger.info(`Mission completion email sent successfully to ${founderEmail}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending mission completion email:', error);
    throw error;
  }
}

async function sendVerificationEmail(email, code) {
  logger.info(`Sending verification email to ${email}`);

  try {
    // Create nodemailer transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser.value(),
        pass: emailPassword.value()
      }
    });

    // Professional HTML email template with Test Monkey branding
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #0A490A 0%, #0f5a0f 100%); border-radius: 12px 12px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🐵 Test Monkey</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px 0; color: #0A490A; font-size: 24px;">Welcome to Test Monkey!</h2>
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                      Thank you for signing up! Please verify your email address to get started.
                    </p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      Your verification code is:
                    </p>

                    <!-- OTP Code Box -->
                    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; padding: 30px; text-align: center; margin: 20px 0;">
                      <div style="color: #0A490A; font-size: 42px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        ${code}
                      </div>
                    </div>

                    <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                      ⏱️ This code will expire in <strong>1 hour</strong>.
                    </p>
                    <p style="margin: 10px 0 0 0; color: #999999; font-size: 13px; line-height: 1.6;">
                      If you didn't request this code, please ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
                    <p style="margin: 0; color: #999999; font-size: 12px;">
                      © ${new Date().getFullYear()} Test Monkey. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: `"Test Monkey" <${emailUser.value()}>`,
      to: email,
      subject: 'Verify Your Email - Test Monkey 🐵',
      html: htmlTemplate,
      text: `Welcome to Test Monkey! Your verification code is: ${code}\n\nThis code will expire in 1 hour.\n\nIf you didn't request this code, please ignore this email.`
    });

    logger.info(`Verification email sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending verification email:', error);
    throw error;
  }
}

export const generateFullMissionReport = onCall(
  { secrets: [anthropicKey], cors: corsOptions },
  async (request) => {
    try {
      const missionId = request?.data?.missionId;
      if (!missionId || typeof missionId !== "string") {
        return { error: "missionId (string) is required." };
      }

      // --- Read mission (questions) ---
      const missionRef = db.collection("Missions").doc(missionId);
      const missionSnap = await missionRef.get();
      if (!missionSnap.exists) {
        return { error: `Mission ${missionId} not found.` };
      }
      const mission = missionSnap.data();
      const SURVEY_QUESTIONS = normalizeQuestions(mission?.questions || []);

      // --- Read submissions for mission ---
      const subsSnap = await db
        .collection("Submissions")
        .where("missionId", "==", missionId)
        .get();

      const submissions = subsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const sourceSubmissionCount = submissions.length;

      // --- Build TESTER_RESPONSES aligned to SURVEY_QUESTIONS ---
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

      // --- Populate contract template (server-side only; no optional blocks) ---
      const contractBody = populateTemplate(CONTRACT_TEMPLATE, {
        SURVEY_QUESTIONS,
        TESTER_RESPONSES,
      });

      // --- Call Anthropic (Claude) ---
      const anthropic = new Anthropic({
        apiKey: anthropicKey.value(),
      });

      // Mirror teammate convention; you can change via env if needed
      const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-5";

      const aiResp = await anthropic.messages.create({
        model,
        max_tokens: 4000,
        system:
          "You are a strict API that returns ONLY valid JSON matching the requested schema. No prose, no markdown.",
        messages: [{ role: "user", content: contractBody }],
      });

      const raw = aiResp?.content?.[0]?.text || "";
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        if (start >= 0 && end > start) {
          parsed = JSON.parse(raw.slice(start, end + 1));
        } else {
          return { error: "AI response was not valid JSON." };
        }
      }

      // --- Validate output shape (light checks) ---
      validateSections(parsed);

      // --- Persist (append-only) ---
      const questionsHash = hashQuestions(SURVEY_QUESTIONS);
      const reportRef = await missionRef.collection("reports").add({
        ai_output_json: parsed,
        generatedAt: FieldValue.serverTimestamp(),
        sourceSubmissionCount,
        questionsHash,
        model,
      });

      // read back timestamp for UI
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
      return { error: err?.message || "Failed to generate mission full report." };
    }
  }
);

export const createVerificationCode = onCall({
  cors: corsOptions,
  secrets: [emailUser, emailPassword]
}, async (request) => {
  const { email, uid } = request.data;

  if (!email || !uid) {
    return { error: "Email and UID are required." };
  }

  try {
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await db.collection("EmailVerifications").doc(uid).set({
      email,
      code,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
      verified: false,
      attempts: 0
    });

    await sendVerificationEmail(email, code);

    logger.info(`Verification code created for ${email}`);
    return { success: true };
  } catch (error) {
    logger.error("Error creating verification code:", error);
    return { error: "Failed to create verification code." };
  }
});

// Verify the code entered by user
export const verifyEmailCode = onCall({ cors: corsOptions }, async (request) => {
  const { uid, code } = request.data;

  if (!uid || !code) {
    return { error: "UID and code are required." };
  }

  try {
    const verificationDoc = await db.collection("EmailVerifications").doc(uid).get();

    if (!verificationDoc.exists) {
      return { error: "Verification not found." };
    }

    const verificationData = verificationDoc.data();

    // Check if already verified
    if (verificationData.verified) {
      return { success: true, message: "Email already verified." };
    }

    // Check expiration
    const now = new Date();
    const expiresAt = verificationData.expiresAt.toDate();
    if (now > expiresAt) {
      return { error: "Verification code has expired." };
    }

    // Check attempts (max 5)
    if (verificationData.attempts >= 5) {
      return { error: "Too many attempts. Please request a new code." };
    }

    // Verify code
    if (verificationData.code !== code) {
      // Increment attempts
      await db.collection("EmailVerifications").doc(uid).update({
        attempts: FieldValue.increment(1)
      });
      return { error: "Invalid verification code." };
    }

    // Mark as verified
    await db.collection("EmailVerifications").doc(uid).update({
      verified: true,
      verifiedAt: FieldValue.serverTimestamp()
    });

    logger.info(`Email verified for user ${uid}`);
    return { success: true, message: "Email verified successfully." };

  } catch (error) {
    logger.error("Error verifying email code:", error);
    return { error: "Failed to verify email." };
  }
});

// Resend verification code
export const resendVerificationCode = onCall({
  cors: corsOptions,
  secrets: [emailUser, emailPassword]
}, async (request) => {
  const { uid, email } = request.data;

  if (!uid || !email) {
    return { error: "UID and email are required." };
  }

  try {
    const verificationDoc = await db.collection("EmailVerifications").doc(uid).get();

    if (verificationDoc.exists) {
      const verificationData = verificationDoc.data();
      if (verificationData.verified) {
        return { error: "Email already verified." };
      }
    }

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.collection("EmailVerifications").doc(uid).set({
      email,
      code,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
      verified: false,
      attempts: 0
    });

    await sendVerificationEmail(email, code);

    logger.info(`Verification code resent for ${email}`);
    return { success: true };
  } catch (error) {
    logger.error("Error resending verification code:", error);
    return { error: "Failed to resend verification code." };
  }
});

// Scheduled function to delete unverified accounts older than 1 hour
export const deleteUnverifiedAccounts = onSchedule("every 30 minutes", async (event) => {
  logger.info("Running cleanup of unverified accounts.");

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const unverifiedSnapshot = await db.collection("EmailVerifications")
      .where("verified", "==", false)
      .where("createdAt", "<", oneHourAgo)
      .get();

    if (unverifiedSnapshot.empty) {
      logger.info("No unverified accounts to delete.");
      return null;
    }

    const batch = db.batch();
    const uidsToDelete = [];

    unverifiedSnapshot.forEach(doc => {
      uidsToDelete.push(doc.id);
      batch.delete(doc.ref);
    });

    // Delete verification documents
    await batch.commit();

    // Delete user accounts from Firebase Auth
    for (const uid of uidsToDelete) {
      try {
        await admin.auth().deleteUser(uid);

        // Also delete from Users collection if exists
        const userDoc = await db.collection("Users").doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();

          // Delete role-specific data
          if (userData.Role === "Founder") {
            const founderQuery = await db.collection("Founders").where("User", "==", uid).get();
            founderQuery.forEach(doc => doc.ref.delete());
          } else if (userData.Role === "TestMonkey") {
            const testerQuery = await db.collection("TestMonkey").where("User", "==", uid).get();
            testerQuery.forEach(doc => doc.ref.delete());
          }

          // Delete user document
          await userDoc.ref.delete();
        }

        logger.info(`Deleted unverified user ${uid}`);
      } catch (error) {
        logger.error(`Failed to delete user ${uid}:`, error);
      }
    }

    logger.info(`Deleted ${uidsToDelete.length} unverified accounts.`);
    return null;

  } catch (error) {
    logger.error("Error during unverified account cleanup:", error);
    return null;
  }
});

export const updateSubmissionCount = onDocumentCreated({
  document: "Submissions/{submissionId}",
  secrets: [emailUser, emailPassword]
}, async (event) => {
  const submissionData = event.data.data();
  const missionId = submissionData.missionId;

  if (!missionId) return null;

  const missionRef = db.collection("Missions").doc(missionId);
  const missionSnap = await missionRef.get();

  if (!missionSnap.exists) {
    console.error(`Mission ${missionId} not found`);
    return null;
  }

  // Increment submissionCount
  await missionRef.update({
    submissionCount: FieldValue.increment(1)
  });

  // Fetch the updated mission
  const updatedSnap = await missionRef.get();
  const mission = updatedSnap.data();

  // Auto-complete mission if it meets the tester goal
  if (mission.submissionCount >= mission.num_testers && mission.status === "Active") {
    await missionRef.update({
      status: "Completed"
    });
    console.log(`Mission ${missionId} marked as Completed`);

    // Send email notification to founder
    try {
      const founderId = mission.owner;
      if (founderId) {
        // Get founder info from Firebase Auth
        const founderUser = await admin.auth().getUser(founderId);

        if (founderUser && founderUser.email) {
          const founderEmail = founderUser.email;
          const founderName = founderUser.displayName || "Founder";
          const missionName = mission.name || "Your Mission";

          await sendMissionCompleteEmail(founderEmail, founderName, missionName, missionId);
          logger.info(`Mission completion email sent to ${founderEmail} for mission ${missionId}`);
        } else {
          logger.warn(`Founder user not found or email missing for owner: ${founderId}`);
        }
      } else {
        logger.warn(`No owner found for mission ${missionId}`);
      }
    } catch (emailError) {
      logger.error(`Failed to send mission completion email for mission ${missionId}:`, emailError);
      // Don't throw - email failure shouldn't stop the function
    }
  }

  return null;
});

export const recalculateAllMissionCounts = onCall({ cors: corsOptions }, async () => {
  const missionsRef = db.collection("Missions");
  const missionsSnap = await missionsRef.get();

  for (const missionDoc of missionsSnap.docs) {
    const missionId = missionDoc.id;
    const submissionsSnap = await db.collection("Submissions")
      .where("missionId", "==", missionId)
      .get();
    const count = submissionsSnap.size;

    await missionDoc.ref.update({ submissionCount: count });
    console.log(`Mission ${missionId}: count set to ${count}`);
  }

  return { success: true };
});

export const summarizeFeedback = onSchedule({
  schedule: "every 24 hours",
  secrets: [anthropicKey], 
}, async (event) => {
  console.log("Running daily feedback summarizer.");


  const anthropic = new Anthropic({
    apiKey: anthropicKey.value(), 
  });

  const missionsRef = db.collection("Missions");

  const snapshot = await missionsRef.where("status", "==", "Active").get();

  if (snapshot.empty) {
    console.log("No active missions to process.");
    return null;
  }

  for (const doc of snapshot.docs) {
    const missionId = doc.id;
    console.log(`Processing mission: ${missionId}`);

    const submissionsSnapshot = await db.collection("Submissions").where("missionId", "==", missionId).get();
    if (submissionsSnapshot.empty) {
      console.log(`No submissions for mission ${missionId}, skipping.`);
      continue;
    }

    let allFeedbackText = "";
    submissionsSnapshot.forEach(subDoc => {
      const submission = subDoc.data();
      submission.answers.forEach(item => {
        allFeedbackText += `Question: ${item.question}\nAnswer: ${item.answer}\n\n`;
      });
    });

    const prompt = `You are a product management assistant. Based on the following user feedback from a website test, generate a concise, actionable summary for the website's founder. Group insights into "Positive Feedback", "Areas for Improvement", and "Bug Reports". Use bullet points. \n\n---BEGIN FEEDBACK---\n${allFeedbackText}\n---END FEEDBACK---`;

    try {
      const summaryMsg = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });
      const summaryText = summaryMsg.content[0].text;
      
      await db.collection("Missions").doc(missionId).update({
        feedbackSummary: summaryText,
        status: "Completed",
      });
      console.log(`Successfully summarized feedback for mission ${missionId}`);

      // Send email notification to founder
      try {
        const missionData = doc.data();
        const founderId = missionData.owner;

        if (founderId) {
          // Get founder info from Firebase Auth
          const founderUser = await admin.auth().getUser(founderId);

          if (founderUser && founderUser.email) {
            const founderEmail = founderUser.email;
            const founderName = founderUser.displayName || "Founder";
            const missionName = missionData.name || "Your Mission";

            await sendMissionCompleteEmail(founderEmail, founderName, missionName, missionId);
            logger.info(`Mission completion email sent to ${founderEmail} for mission ${missionId}`);
          } else {
            logger.warn(`Founder user not found or email missing for owner: ${founderId}`);
          }
        } else {
          logger.warn(`No owner found for mission ${missionId}`);
        }
      } catch (emailError) {
        logger.error(`Failed to send mission completion email for mission ${missionId}:`, emailError);
        // Don't throw - email failure shouldn't stop the function
      }
    } catch (error) {
      console.error(`Failed to get summary for mission ${missionId}:`, error);
    }
  }
  return null;
});


export const generateMissionReport = onCall({ secrets: [anthropicKey], cors: corsOptions }, async (request) =>  {
  const missionId = request.data.missionId;
  if (!missionId) {
    logger.error("No missionId was provided.");
    return { error: "Mission ID is required." };
  }

  logger.info(`Generating on-demand report for mission: ${missionId}`);

  try {
    const submissionsRef = db.collection("Submissions");
    const q = submissionsRef.where("missionId", "==", missionId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      logger.warn(`No submissions found for mission: ${missionId}`);
      return { report: "No submissions found for this mission." };
    }

    let aggregatedFeedbackText = "";
    querySnapshot.forEach((doc) => {
      const submissionData = doc.data();
      if (submissionData.answers && Array.isArray(submissionData.answers)) {
        submissionData.answers.forEach(item => {
          aggregatedFeedbackText += item.answer + "\n";
        });
      }
    });

    logger.info("Successfully aggregated feedback for on-demand report.");

    const anthropic = new Anthropic({
      apiKey: anthropicKey.value(),
    });

    const prompt = `You are an expert product feedback analyst. Based on the raw, aggregated user feedback provided below, perform the following tasks:
                    1.  Generate an array of the top 15 most frequent and meaningful sentiment keywords. For each keyword, provide a numerical weight from 1 to 10 based on its frequency and importance.
                    2.  Provide a brief, neutral summary of the feedback.
                    3.  Generate a concise, actionable summary of 3-5 key takeaways for the founder to implement. Use bullet points.

                    Return the entire response as a single, minified JSON object with no formatting or markdown. The JSON object must have the following keys: "sentimentKeywords", "overview", and "actionableSummary".

                    The "sentimentKeywords" value must be an array of objects, where each object has a "word" (string) and a "weight" (number). \n\n---BEGIN FEEDBACK---\n${aggregatedFeedbackText}\n---END FEEDBACK---`;

    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const reportJsonString = aiResponse.content[0].text;
    const parsedReport = JSON.parse(reportJsonString);

    await db.collection("Missions").doc(missionId).update({
      aiReport: parsedReport,
      status: "Completed"
    });

    logger.info(`Successfully generated and saved AI report for mission ${missionId}`);


    return {
      success: true,
      report: parsedReport
    };

  } catch (error) {
    logger.error("Error generating on-demand report:", error);
    return { error: "Failed to generate report." };
  }
});

export const generateMissionQuestions = onCall({ secrets: [anthropicKey] }, async (request) => {
  const { description, website } = request.data;

  if (!description || !website) {
    logger.error("Missing required parameters: description and website");
    return { error: "Description and website URL are required." };
  }

  logger.info(`Generating questions for website: ${website}`);

  try {
    const anthropic = new Anthropic({
      apiKey: anthropicKey.value(),
    });

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      temperature: 1,
      system: 'You are a Business Analysis that is helping a client to create a feedback form for new testers to test their website from a summary of their website. The feedback form should only include open ended questions. Keep the number of questions as minimal as possible, but ensure every question will get the best answers from the testers. Ensure that your response is in a format that can be split into an array by a javascript function using |||. As your response will only be read by the javascript function, do not include anything unnecessary.',
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: description + "\n This is the link to the website: " + website
            }
          ]
        }
      ]
    });

    const questionText = msg.content[0].text;
    const questionArr = questionText.split("|||");

    logger.info(`Successfully generated ${questionArr.length} questions`);

    return {
      success: true,
      questions: questionArr
    };

  } catch (error) {
    logger.error("Error generating mission questions:", error);
    return { error: "Failed to generate questions." };
  }
});