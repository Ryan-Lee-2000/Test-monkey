<script setup>
import { ref, onMounted } from 'vue'
import { getRecentWinners } from '@/Database/GachaSystem'
import { getUserName } from '@/Database/Monkey_Store'

const winners = ref([])
const isLoading = ref(true)

// Rarity colors
const rarityColors = {
  common: '#6c757d',
  rare: '#0d6efd',
  epic: '#9333ea',
  legendary: '#fbbf24'
}

async function loadRecentWinners() {
  try {
    isLoading.value = true

    // Fetch recent winners
    const recentWinners = await getRecentWinners(15)

    // Fetch user names for each winner
    const winnersWithNames = await Promise.all(
      recentWinners.map(async (winner) => {
        try {
          const userName = await getUserName(winner.userId)
          return {
            ...winner,
            userName: userName || 'Anonymous Tester'
          }
        } catch (error) {
          console.error('Error fetching username:', error)
          return {
            ...winner,
            userName: 'Anonymous Tester'
          }
        }
      })
    )

    winners.value = winnersWithNames
  } catch (error) {
    console.error('Error loading recent winners:', error)
  } finally {
    isLoading.value = false
  }
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000)

  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + ' years ago'

  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + ' months ago'

  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + ' days ago'

  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + ' hours ago'

  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + ' minutes ago'

  return 'just now'
}

onMounted(() => {
  loadRecentWinners()
})
</script>

<template>
  <div class="recent-winners-container">
    <h3 class="feed-title">
      <i class="fas fa-trophy"></i>
      Recent Winners
    </h3>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-4">
      <div class="spinner-border spinner-border-sm" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="winners.length === 0" class="empty-feed">
      <p class="text-muted">No recent winners yet. Be the first!</p>
    </div>

    <!-- Winners Feed -->
    <div v-else class="winners-feed">
      <div
        v-for="winner in winners"
        :key="winner.id"
        class="winner-item"
      >
        <div class="winner-icon">🎉</div>

        <div class="winner-details">
          <div class="winner-name">{{ winner.userName }}</div>
          <div class="winner-prize">
            won
            <span
              class="voucher-badge"
              :style="{ background: rarityColors[winner.rarity] }"
            >
              {{ winner.rarity.toUpperCase() }}
            </span>
            <strong>{{ winner.voucherBrand }} S${{ winner.voucherAmount }}</strong>
          </div>
          <div class="winner-time">{{ getTimeAgo(winner.openedAt) }}</div>
        </div>

        <div class="winner-pack-type">
          <span v-if="winner.isFree" class="badge bg-success">Free</span>
          <span v-else class="badge bg-primary">Paid</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recent-winners-container {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--color-gray-200);
  box-shadow: var(--shadow-sm);
  max-height: 500px;
  overflow-y: auto;
}

.feed-title {
  color: var(--color-gray-900);
  font-size: 1.25rem;
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-lg);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.feed-title i {
  color: #0A490A;
}

.empty-feed {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-gray-500);
}

.winners-feed {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.winner-item {
  background: var(--color-gray-50);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  transition: transform 0.2s, background 0.2s;
  border: 1px solid var(--color-gray-200);
}

.winner-item:hover {
  background: var(--color-gray-100);
  transform: translateX(4px);
}

.winner-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.winner-details {
  flex: 1;
  min-width: 0;
}

.winner-name {
  color: var(--color-gray-900);
  font-weight: var(--font-weight-semibold);
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.winner-prize {
  color: var(--color-gray-700);
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.voucher-badge {
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  font-weight: var(--font-weight-bold);
  color: white;
  white-space: nowrap;
}

.winner-time {
  color: var(--color-gray-500);
  font-size: 0.75rem;
}

.winner-pack-type {
  flex-shrink: 0;
}

/* Custom scrollbar */
.recent-winners-container::-webkit-scrollbar {
  width: 6px;
}

.recent-winners-container::-webkit-scrollbar-track {
  background: var(--color-gray-100);
  border-radius: var(--radius-full);
}

.recent-winners-container::-webkit-scrollbar-thumb {
  background: var(--color-gray-400);
  border-radius: var(--radius-full);
}

.recent-winners-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-gray-500);
}
</style>
