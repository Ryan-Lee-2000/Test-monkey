<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import navbar from '../../navbar.vue';                  // same navbar as FounderDashboard.vue
import { generateFullReport, getLatestReport } from '../services/aiClient'; // calls functions(us-central1)

const route = useRoute();
const router = useRouter();

// Support either /dashboard/:missionId or /missions/:missionId/report
const missionId = computed(() => route.params.missionId || '');

const isLoading = ref(false);
const errorMsg = ref('');
const sections = ref(null);
const generatedAt = ref(null);
const reportId = ref(null);
const sourceSubmissionCount = ref(null);
const hasExistingReport = ref(false);

const hasSections = computed(() => {
  const s = sections.value;
  if (!s || typeof s !== 'object') return false;
  return !!(
    s.section_1_sentiment_analysis &&
    s.section_2_scoring_and_pain_points &&
    s.section_3_actionable_steps_and_ranking &&
    s.section_4_review_by_questions
  );
});

function pct(val) {
  const n = Number(val);
  if (Number.isFinite(n)) return Math.round(n);
  return 0;
}

function goBack() {
  if (window.history.length > 1) router.back();
  else router.push({ path: '/' });
}

async function loadExistingReport() {
  if (!missionId.value) {
    errorMsg.value = 'Missing missionId in route.';
    return;
  }
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const resp = await getLatestReport({ missionId: missionId.value });
    if (resp && resp.success) {
      // Found existing report
      sections.value = resp.sections || null;
      generatedAt.value = resp.generatedAt || null;
      reportId.value = resp.reportId || null;
      sourceSubmissionCount.value =
        typeof resp.sourceSubmissionCount === 'number' ? resp.sourceSubmissionCount : null;
      hasExistingReport.value = true;
      isLoading.value = false;
    } else {
      // No existing report, auto-generate one
      hasExistingReport.value = false;
      // Don't set isLoading to false here, let generate() handle it
      await generate();
    }
  } catch (err) {
    errorMsg.value = err?.message || 'Failed to load the report.';
    isLoading.value = false;
  }
}

async function generate() {
  if (!missionId.value) {
    errorMsg.value = 'Missing missionId in route.';
    return;
  }
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const resp = await generateFullReport({ missionId: missionId.value });
    if (!resp || !resp.success) throw new Error(resp?.error || 'Report generation failed');
    sections.value = resp.sections || null;
    generatedAt.value = resp.generatedAt || null;
    reportId.value = resp.reportId || null;
    sourceSubmissionCount.value =
      typeof resp.sourceSubmissionCount === 'number' ? resp.sourceSubmissionCount : null;
    hasExistingReport.value = true;
  } catch (err) {
    errorMsg.value = err?.message || 'Failed to generate the report.';
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  // Check for existing report first instead of auto-generating
  loadExistingReport();
});
</script>

<template>
  <navbar />

  <div class="dashboard-container">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1>Full Mission Report</h1>
        <p class="text-muted">Consolidated analysis from tester submissions</p>
      </div>
      <div class="header-actions">
        <button class="btn-modern btn-ghost-dark" @click="goBack" :disabled="isLoading">
          <i class="fas fa-arrow-left me-2"></i>Back
        </button>
        <button class="btn-modern btn-primary" @click="generate" :disabled="isLoading">
          <i v-if="!isLoading" class="fas fa-rotate me-2"></i>
          <span v-else class="spinner spinner-inline me-2" aria-hidden="true"></span>
          {{ isLoading ? 'Generating…' : (hasExistingReport ? 'Regenerate Report' : 'Generate Report') }}
        </button>
      </div>
    </div>

    <!-- Meta / Info Row -->
    <div class="meta-row">
      <div class="meta-chip">
        <i class="fas fa-id-badge me-2"></i>
        <span class="label">Mission ID:</span>
        <code class="value">{{ missionId }}</code>
      </div>
      <div class="meta-chip" v-if="generatedAt">
        <i class="fas fa-clock me-2"></i>
        <span class="label">Generated:</span>
        <span class="value">{{ generatedAt }}</span>
      </div>
      <div class="meta-chip" v-if="sourceSubmissionCount !== null">
        <i class="fas fa-users me-2"></i>
        <span class="label">Submissions:</span>
        <span class="value">{{ sourceSubmissionCount }}</span>
      </div>
      <div class="meta-chip" v-if="reportId">
        <i class="fas fa-hashtag me-2"></i>
        <span class="label">Report ID:</span>
        <code class="value">{{ reportId }}</code>
      </div>
    </div>

    <!-- Error -->
    <div v-if="errorMsg" class="card-modern error-card">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <div class="error-title">Couldn’t generate the report</div>
        <div class="error-text">{{ errorMsg }}</div>
        <button class="btn-modern btn-primary" @click="generate" :disabled="isLoading">
          Try again
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && !hasSections && !errorMsg" class="loading-state">
      <div class="spinner"></div>
      <p>Generating your full mission report…</p>
    </div>

    <!-- Sections -->
    <div v-if="hasSections" class="sections-grid">
      <!-- Section 1: Sentiment Analysis -->
      <div class="card-modern">
        <div class="section-header">
          <h3><i class="fas fa-face-smile me-2"></i>1) Sentiment Analysis</h3>
        </div>
        <div class="section-body">
          <p class="section-summary">
            {{ sections.section_1_sentiment_analysis?.overall_summary }}
          </p>
          <div class="sentiment-grid">
            <div class="sentiment-box">
              <div class="sentiment-label">Positive</div>
              <div class="sentiment-value">
                {{ pct(sections.section_1_sentiment_analysis?.distribution?.positive_percent) }}%
              </div>
            </div>
            <div class="sentiment-box">
              <div class="sentiment-label">Neutral</div>
              <div class="sentiment-value">
                {{ pct(sections.section_1_sentiment_analysis?.distribution?.neutral_percent) }}%
              </div>
            </div>
            <div class="sentiment-box">
              <div class="sentiment-label">Negative</div>
              <div class="sentiment-value">
                {{ pct(sections.section_1_sentiment_analysis?.distribution?.negative_percent) }}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Scoring & Pain Points -->
      <div class="card-modern">
        <div class="section-header">
          <h3><i class="fas fa-chart-line me-2"></i>2) Scoring &amp; Pain Points</h3>
        </div>
        <div class="section-body">
          <div class="areas-grid">
            <div
              v-for="(area, idx) in sections.section_2_scoring_and_pain_points?.areas || []"
              :key="idx"
              class="area-card"
            >
              <div class="area-head">
                <div class="area-title">{{ area.area }}</div>
                <div class="area-score"><span class="score">{{ area.score_1_to_5 }}</span>/5</div>
              </div>
              <div class="area-stars">{{ area.stars }}</div>
              <div class="area-comment">{{ area.comment }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 3: Actionable Steps & Ranking -->
      <div class="card-modern">
        <div class="section-header">
          <h3><i class="fas fa-list-check me-2"></i>3) Actionable Steps &amp; Ranking</h3>
        </div>
        <div class="section-body">
          <div class="actions-grid">
            <div class="actions-col">
              <div class="actions-title high">High (Top 3)</div>
              <ol class="actions-list">
                <li v-for="(item, i) in sections.section_3_actionable_steps_and_ranking?.high || []" :key="'h-'+i">
                  <div class="action-title">{{ item.action }}</div>
                  <div class="action-sub small">{{ item.rationale }}</div>
                  <div class="action-tags">
                    <span class="tag tag-danger">Impact: {{ item.impact }}</span>
                    <span class="tag tag-gray">Effort: {{ item.effort }}</span>
                  </div>
                </li>
              </ol>
            </div>

            <div class="actions-col">
              <div class="actions-title medium">Medium (3)</div>
              <ol class="actions-list">
                <li v-for="(item, i) in sections.section_3_actionable_steps_and_ranking?.medium || []" :key="'m-'+i">
                  <div class="action-title">{{ item.action }}</div>
                  <div class="action-sub small">{{ item.rationale }}</div>
                  <div class="action-tags">
                    <span class="tag tag-warning">Impact: {{ item.impact }}</span>
                    <span class="tag tag-gray">Effort: {{ item.effort }}</span>
                  </div>
                </li>
              </ol>
            </div>

            <div class="actions-col">
              <div class="actions-title low">Low (2)</div>
              <ol class="actions-list">
                <li v-for="(item, i) in sections.section_3_actionable_steps_and_ranking?.low || []" :key="'l-'+i">
                  <div class="action-title">{{ item.action }}</div>
                  <div class="action-sub small">{{ item.rationale }}</div>
                  <div class="action-tags">
                    <span class="tag tag-success">Impact: {{ item.impact }}</span>
                    <span class="tag tag-gray">Effort: {{ item.effort }}</span>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 4: Review by Questions -->
      <div class="card-modern">
        <div class="section-header">
          <h3><i class="fas fa-comments me-2"></i>4) Review by Questions</h3>
        </div>
        <div class="section-body">
          <div
            v-for="(q, i) in sections.section_4_review_by_questions?.questions || []"
            :key="i"
            class="q-block"
          >
            <div class="q-head">
              <div class="q-title">Q{{ i + 1 }}. {{ q.question_text }}</div>
              <div class="q-summary small text-muted">{{ q.short_summary }}</div>
            </div>

            <div class="table-wrap">
              <table class="table-compact">
                <thead>
                  <tr>
                    <th style="width: 24%;">Tester</th>
                    <th>Answer</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(ans, j) in q.answers || []" :key="j">
                    <td class="tester-cell">
                      <div class="tester-name">{{ ans.tester_name || ans.tester_id || 'Unknown' }}</div>
                      <div class="tester-id small text-muted" v-if="ans.tester_id && ans.tester_name">
                        ({{ ans.tester_id }})
                      </div>
                    </td>
                    <td>
                      <span v-if="ans.answer && ans.answer.trim().length">{{ ans.answer }}</span>
                      <span v-else class="text-muted fst-italic">— no response —</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Empty state after load -->
    <div v-if="!isLoading && !hasSections && !errorMsg" class="empty-state card-modern">
      <i class="fas fa-inbox empty-icon"></i>
      <h3>No report generated yet</h3>
      <p class="text-muted">Click “Generate Report” to create one for this mission.</p>
      <button class="btn-modern btn-primary" @click="generate">Generate Report</button>
    </div>
  </div>
</template>

<style scoped>
/* Align container & header with FounderDashboard.vue */
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-2xl);
  padding-top: 100px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-2xl);
}

.page-header h1 {
  margin: 0;
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
}

.page-header p {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-base);
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
}

/* Meta row chips */
.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 8px 12px;
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-full);
  color: var(--color-gray-800);
  font-size: var(--font-size-sm);
}

.meta-chip .label { color: var(--color-gray-600); }
.meta-chip .value { color: var(--color-gray-900); }

/* Cards / Sections */
.card-modern {
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  background: var(--color-white);
  box-shadow: var(--shadow-sm);
}

.section-header {
  border-bottom: 1px solid var(--color-gray-200);
  padding-bottom: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.section-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  display: flex;
  align-items: center;
}

.section-body { color: var(--color-gray-800); }

/* Section 1 */
.section-summary {
  color: var(--color-gray-700);
  margin-bottom: var(--spacing-lg);
  line-height: var(--line-height-relaxed);
}

.sentiment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-md);
}

.sentiment-box {
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  background: var(--color-gray-50);
}

.sentiment-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-xs);
}

.sentiment-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  line-height: 1.1;
}

/* Section 2 */
.areas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-md);
}

.area-card {
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  background: var(--color-gray-50);
}

.area-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xs);
}

.area-title {
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
}

.area-score .score {
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
}

.area-stars {
  margin: 4px 0 8px 0;
  letter-spacing: 0.1rem;
  color: var(--color-warning);
}

.area-comment { color: var(--color-gray-700); }

/* Section 3 */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--spacing-md);
}

.actions-col .actions-title {
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-gray-900);
}

.actions-title.high   { color: var(--color-danger); }
.actions-title.medium { color: var(--color-warning); }
.actions-title.low    { color: var(--color-success); }

.actions-list {
  padding-left: 1.25rem;
  margin: 0;
}

.actions-list li { margin-bottom: var(--spacing-sm); }

.action-title { font-weight: var(--font-weight-semibold); color: var(--color-gray-900); }
.action-sub   { color: var(--color-gray-700); margin: 2px 0 6px 0; }

.action-tags .tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  margin-right: 6px;
  border: 1px solid var(--color-gray-200);
  background: var(--color-white);
  color: var(--color-gray-800);
}

.tag-danger  { background: var(--color-danger-bg);  color: var(--color-danger);  border-color: var(--color-danger); }
.tag-warning { background: var(--color-warning-bg); color: var(--color-warning); border-color: var(--color-warning); }
.tag-success { background: var(--color-success-bg); color: var(--color-success); border-color: var(--color-success); }
.tag-gray    { background: var(--color-gray-100);  color: var(--color-gray-700); }

/* Section 4 */
.q-block { padding: var(--spacing-md) 0; border-bottom: 1px solid var(--color-gray-200); }
.q-head  { margin-bottom: var(--spacing-sm); }
.q-title { font-weight: var(--font-weight-semibold); color: var(--color-gray-900); }

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  background: var(--color-white);
}

.table-compact { width: 100%; border-collapse: collapse; }
.table-compact thead th {
  background: var(--color-gray-50);
  color: var(--color-gray-800);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-gray-200);
}
.table-compact tbody td {
  padding: 10px 12px;
  border-top: 1px solid var(--color-gray-100);
  vertical-align: top;
  color: var(--color-gray-800);
}

.tester-cell .tester-name { font-weight: var(--font-weight-semibold); color: var(--color-gray-900); }

/* Loading & Error to match dashboard look */
.loading-state { text-align: center; padding: var(--spacing-3xl); }

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-md);
}
.spinner-inline { width: 16px; height: 16px; border-width: 2px; margin-bottom: -2px; }
@keyframes spin { to { transform: rotate(360deg); } }

.error-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  border-left: 4px solid var(--color-danger);
  background: var(--color-danger-bg);
  color: var(--color-danger);
  margin-bottom: var(--spacing-xl);
}
.error-icon { font-size: 20px; line-height: 1; }
.error-content .error-title { font-weight: var(--font-weight-semibold); margin-bottom: 4px; }

/* Layout */
.sections-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-container { padding: var(--spacing-lg); padding-top: 80px; }
  .page-header { flex-direction: column; gap: var(--spacing-md); }
}
</style>
