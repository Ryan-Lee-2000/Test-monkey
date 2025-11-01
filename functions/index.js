import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import { Anthropic } from "@anthropic-ai/sdk";
import admin from "firebase-admin";
import nodemailer from "nodemailer"; 

admin.initializeApp();
const db = admin.firestore();
const { FieldValue } = admin.firestore;
const anthropicKey = defineSecret("ANTHROPIC_KEY");

// CORS configuration
const corsOptions = {
  origin: true, // Allow all origins in development
  credentials: true,
};

// Email verification helpers
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, code) {
  // For development: Log the code to console
  logger.info(`Verification code for ${email}: ${code}`);

  // In production, you would use a service like SendGrid, Mailgun, or Firebase Extensions
  // For now, we'll use nodemailer with a test account for development
  try {
    // Create a test account (or use your SMTP credentials in production)
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      // For development, just log the code
      logger.info(`DEV MODE: Verification code for ${email}: ${code}`);
      return { success: true, code }; // Return code in dev mode for testing
    }

    // Production email sending would go here
    // Example with nodemailer:
    // const transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASSWORD
    //   }
    // });
    //
    // await transporter.sendMail({
    //   from: '"Test Monkey" <noreply@testmonkey.com>',
    //   to: email,
    //   subject: 'Verify Your Email - Test Monkey',
    //   html: `
    //     <h2>Welcome to Test Monkey!</h2>
    //     <p>Your verification code is:</p>
    //     <h1 style="color: #4A90E2; font-size: 32px; letter-spacing: 4px;">${code}</h1>
    //     <p>This code will expire in 1 hour.</p>
    //     <p>If you didn't request this code, please ignore this email.</p>
    //   `
    // });

    return { success: true };
  } catch (error) {
    logger.error('Error sending verification email:', error);
    throw error;
  }
}

// Create verification code for a user
export const createVerificationCode = onCall({ cors: corsOptions }, async (request) => {
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

    // In development, return the code for easy testing
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (isDevelopment) {
      return { success: true, devCode: code };
    }

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
export const resendVerificationCode = onCall({ cors: corsOptions }, async (request) => {
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