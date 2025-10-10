const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/v2/params");
const admin = require("firebase-admin");
const { Anthropic } = require("@anthropic-ai/sdk");


admin.initializeApp();
const db = admin.firestore();


const anthropicKey = defineSecret("ANTHROPIC_KEY");


exports.summarizeFeedback = onSchedule({
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