import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import { Anthropic } from "@anthropic-ai/sdk";
import admin from "firebase-admin"; 

admin.initializeApp();
const db = admin.firestore();
const { FieldValue } = admin.firestore;
const anthropicKey = defineSecret("ANTHROPIC_KEY");

export const updateSubmissionCount = onDocumentCreated("Submissions/{submissionId}", async (event) => {
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
  }

  return null;
});

export const recalculateAllMissionCounts = onCall(async () => {
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
        model: "claude-3-sonnet-20240229",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });
      const summaryText = summaryMsg.content[0].text;
      
      await db.collection("Missions").doc(missionId).update({
        feedbackSummary: summaryText,
        status: "Completed",
      });
      console.log(`Successfully summarized feedback for mission ${missionId}`);
    } catch (error) {
      console.error(`Failed to get summary for mission ${missionId}:`, error);
    }
  }
  return null;
});


export const generateMissionReport = onCall({ secrets: [anthropicKey] }, async (request) =>  {
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
      model: "claude-3-sonnet-20240229",
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