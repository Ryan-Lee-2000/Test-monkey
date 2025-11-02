<template>
  <div class="navbar-skeleton">
    <!-- Avatar skeleton -->
    <div class="skeleton-avatar"></div>

    <!-- Chevron skeleton -->
    <div class="skeleton-chevron"></div>
  </div>
</template>

<style scoped>
.navbar-skeleton {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 4px 12px 4px 4px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-full);
  min-height: 44px;
}

.skeleton-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-chevron {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  animation-delay: 0.2s;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
