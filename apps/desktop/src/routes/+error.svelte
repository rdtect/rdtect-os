<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="h-screen w-screen bg-desktop-bg flex items-center justify-center" style="font-family: var(--desktop-font-sans);">
  <div class="text-center">
    <div class="mb-4" style="font-size: var(--text-4xl);">⚠️</div>
    <h1 class="text-slate-100 font-semibold mb-2" style="font-size: var(--text-2xl);">
      {$page.status}
    </h1>
    <p class="text-slate-400 mb-6" style="font-size: var(--text-base);">
      {$page.error?.message ?? 'Something went wrong'}
    </p>
    <a href="/" class="px-4 py-2 bg-desktop-accent text-white hover:bg-desktop-accent/80"
       style="border-radius: var(--radius-md); transition: background-color var(--transition-normal) var(--transition-easing);">
      Return to Desktop
    </a>
  </div>
</div>
