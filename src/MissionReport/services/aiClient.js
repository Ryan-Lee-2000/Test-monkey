import { httpsCallable } from 'firebase/functions';
import { functions, auth, db } from '../../Config/api_services.js'; // Use pre-configured functions instance
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * Fetches the most recent report for a mission from Firestore.
 * @param {Object} params
 * @param {string} params.missionId - Mission document ID in Firestore.
 * @returns {Promise<Object|null>} The latest report or null if none exists.
 */
export async function getLatestReport({ missionId }) {
  try {
    if (!missionId) throw new Error('Missing missionId');

    const reportsRef = collection(db, 'Missions', missionId, 'reports');
    const q = query(reportsRef, orderBy('generatedAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      success: true,
      reportId: doc.id,
      generatedAt: data.generatedAt?.toDate?.().toISOString?.() || null,
      sourceSubmissionCount: data.sourceSubmissionCount,
      sections: data.ai_output_json,
      model: data.model
    };
  } catch (error) {
    console.error('Error fetching latest report:', error);
    return null;
  }
}

/**
 * Calls the backend Cloud Function to generate a full mission report.
 * @param {Object} params
 * @param {string} params.missionId - Mission document ID in Firestore.
 * @returns {Promise<Object>} Report response from the callable.
 */
export async function generateFullReport({ missionId }) {
  try {
    if (!missionId) throw new Error('Missing missionId');

    // Verify user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to generate reports');
    }

    const callGenerate = httpsCallable(functions, 'generateFullMissionReport');
    const result = await callGenerate({ missionId });

    // Return data for frontend parsing
    return result?.data || { success: false, message: 'No data returned from function' };
  } catch (error) {
    console.error('AI report generation error:', error);
    throw new Error(error.message || 'Failed to call AI function');
  }
}

