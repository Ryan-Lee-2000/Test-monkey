import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../Config/api_services.js'; // mirrors teammate’s setup

/**
 * Calls the backend Cloud Function to generate a full mission report.
 * @param {Object} params
 * @param {string} params.missionId - Mission document ID in Firestore.
 * @returns {Promise<Object>} Report response from the callable.
 */
export async function generateFullReport({ missionId }) {
  try {
    if (!missionId) throw new Error('Missing missionId');

    // Default backend region (since firebase.json has no region field)
    const functions = getFunctions(app, 'us-central1');

    const callGenerate = httpsCallable(functions, 'generateFullMissionReport');
    const result = await callGenerate({ missionId });

    // Return data for frontend parsing
    return result?.data || { success: false, message: 'No data returned from function' };
  } catch (error) {
    console.error('AI report generation error:', error);
    throw new Error(error.message || 'Failed to call AI function');
  }
}

