<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-5xl mx-auto px-5 py-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl sm:text-3xl font-bold">
          {{ mission?.name || "Mission Report" }}
        </h1>
        <router-link
          to="/dashboard"
          class="text-sm text-blue-600 hover:underline"
          >← Back to Dashboard</router-link
        >
      </div>

      <div class="grid sm:grid-cols-2 gap-4 mb-8">
        <div class="bg-white rounded-xl p-4 shadow">
          <div class="text-xs text-gray-500">Status</div>
          <div class="text-base font-medium">
            {{ mission?.status ?? "—" }}
          </div>
        </div>
        <div class="bg-white rounded-xl p-4 shadow">
          <div class="text-xs text-gray-500">Progress</div>
          <div class="text-base font-medium">
            {{ (mission?.submissionCount ?? 0) }} / {{ (mission?.num_testers ?? 0) }}
          </div>
        </div>
        </div>

      <section class="mb-10">
       <h2 class="text-xl font-semibold mb-3">Word Sentiment Cloud</h2>

        <div class="bg-white rounded-xl shadow p-4 min-h-[12rem]">
          <div v-if="!sentimentKeywords?.length" class="h-48 flex items-center justify-center">
            <p class="text-gray-400 italic">
              Sentiment keywords will appear here when the analysis is ready.
            </p>
          </div>

          <div v-else class="flex flex-wrap gap-3">
            <span
              v-for="(kw, idx) in sentimentKeywords"
              :key="idx"
              class="inline-flex items-center rounded-full px-3 py-1 border border-gray-200 text-gray-800"
              :style="{ fontSize: fontSizeForWeight(kw.weight) }"
              >{{ kw.word }}</span
            >
          </div>
        </div>
        <p v-if="aiOverview" class="text-gray-600 mt-3">
          {{ aiOverview }}
        </p>
        </section>

      <section class="mb-10">
<h2 class="text-xl font-semibold mb-3">Overall Feedback by Question</h2>
        <div class="bg-white rounded-xl shadow divide-y">
          <div
            v-if="!byQuestion?.length"
            class="p-6 text-gray-400 italic"
          >
            Summarized feedback by question will appear here when ready.
          </div>

          <div
            v-for="(item, i) in byQuestion"
            :key="i"
            class="p-4"
          >
            <p class="font-medium text-gray-900">
              Q{{ i + 1 }}: {{ item.question || "Question" }}
            </p>
            <p class="text-gray-700 mt-1">
              {{ item.summary || "—" }}
            </p>
          </div>
        </div>
        </section>

      <section class="mb-16">
        <h2 class="text-xl font-semibold mb-3">Actionable Steps</h2>

        <div class="bg-white rounded-xl shadow p-4">
          <ul v-if="actionableSteps?.length" class="space-y-2">
            <li
              v-for="(step, i) in actionableSteps"
              :key="i"
              class="flex items-start gap-2"
            >
              <span class="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
              <span class="text-gray-800">{{ step }}</span>
            </li>
          </ul>

          <div v-else class="text-gray-400 italic">
            Actionable recommendations will appear here when ready.
          </div>
        </div>
        </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";

const route = useRoute();
const db = getFirestore();

// FIXED: Changed route.params.id to route.params.missionId
const missionId = route.params.missionId;

// state
const mission = ref(null);
const aiReport = ref(null);

// derived: sections the Claude pipeline will populate
const sentimentKeywords = computed(() => aiReport.value?.sentimentKeywords || []);
const aiOverview = computed(() => aiReport.value?.overview || mission.value?.feedbackSummary || "");
const byQuestion = computed(() => aiReport.value?.byQuestion || []); // expect [{question, summary}]
const actionableSteps = computed(() => aiReport.value?.actionableSummary || []); // expect [string]

// font scaling for sentiment cloud weights (1–10)
function fontSizeForWeight(weight) {
  const w = Number(weight) || 1;
  const min = 12;  // px
  const max = 38;  // px
  const clamped = Math.max(1, Math.min(10, w));
  const px = min + ((clamped - 1) / 9) * (max - min);
  return `${px}px`;
}

// live subscription to the mission doc
onMounted(() => {
  if (!missionId) {
    console.error("Mission ID is missing from the route.");
    return;
  }
  const missionRef = doc(db, "Missions", missionId);
  const unsub = onSnapshot(missionRef, (snap) => {
    if (!snap.exists()) {
      mission.value = null;
      aiReport.value = null;
      return;
    }
    const data = snap.data();
    mission.value = { id: snap.id, ...data };
    aiReport.value = data.aiReport ?? null;
  });
});
</script>