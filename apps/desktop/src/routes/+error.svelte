<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="h-screen w-screen bg-desktop-bg flex items-center justify-center">
  <div class="text-center">
    <div class="text-6xl mb-4">⚠️</div>
    <h1 class="text-desktop-text text-2xl font-semibold mb-2">
      {$page.status}
    </h1>
    <p class="text-desktop-text-secondary mb-6">
      {$page.error?.message ?? 'Something went wrong'}
    </p>
    <a href="/" class="px-4 py-2 bg-desktop-accent text-white rounded-desktop-md hover:bg-desktop-accent-hover transition-colors">
      Return to Desktop
    </a>
  </div>
</div>
