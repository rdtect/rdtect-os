<script lang="ts">
  /**
   * Contact - Main Container Component
   *
   * Professional contact form with glassmorphism design.
   * Supports PocketBase submission with graceful fallback.
   */
  import ContactForm from './ContactForm.svelte';
  import SuccessMessage from './SuccessMessage.svelte';

  interface Props {
    windowId?: string;
  }

  let { windowId = 'contact-default' }: Props = $props();

  // Form state
  type FormState = 'form' | 'submitting' | 'success' | 'error';
  let formState = $state<FormState>('form');
  let errorMessage = $state<string>('');

  // PocketBase configuration
  const POCKETBASE_URL = import.meta.env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

  async function handleSubmit(formData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    formState = 'submitting';
    errorMessage = '';

    try {
      const response = await fetch(`${POCKETBASE_URL}/api/collections/contact_messages/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          submitted_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit message');
      }

      formState = 'success';
    } catch (error) {
      console.error('Contact form submission failed:', error);
      errorMessage = 'Unable to send message. Please try contacting via social media or email directly.';
      formState = 'error';
    }
  }

  function handleReset() {
    formState = 'form';
    errorMessage = '';
  }

  // Social links
  const socialLinks = [
    { name: 'GitHub', url: 'https://github.com/rdtect', icon: 'github' },
    { name: 'LinkedIn', url: 'https://linkedin.com/in/rdtect', icon: 'linkedin' },
    { name: 'Email', url: 'mailto:rdtect@outlook.com', icon: 'mail' },
  ];
</script>

<div class="contact-container">
  <!-- Header -->
  <header class="contact-header">
    <div class="header-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2"/>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    </div>
    <div class="header-text">
      <h1>Get in Touch</h1>
      <p>rdtect@outlook.com · Dehradun, India</p>
    </div>
  </header>

  <!-- Main Content -->
  <main class="contact-main">
    {#if formState === 'success'}
      <div class="fade-in">
        <SuccessMessage onReset={handleReset} />
      </div>
    {:else}
      <div class="glass-card" class:fade-in={formState === 'form'}>
        <ContactForm
          onSubmit={handleSubmit}
          isSubmitting={formState === 'submitting'}
          {errorMessage}
        />
      </div>
    {/if}
  </main>

  <!-- Social Links Footer -->
  <footer class="contact-footer">
    <p class="footer-text">Or connect via</p>
    <div class="social-links">
      {#each socialLinks as link}
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          class="social-link"
          title={link.name}
        >
          {#if link.icon === 'github'}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          {:else if link.icon === 'linkedin'}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          {:else if link.icon === 'twitter'}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          {:else if link.icon === 'mail'}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          {/if}
        </a>
      {/each}
    </div>
  </footer>
</div>

<style>
  .contact-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
  }

  /* Header */
  .contact-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px;
    background: linear-gradient(180deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%);
    border-bottom: 1px solid rgba(99, 102, 241, 0.2);
  }

  .header-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.3));
    border-radius: 12px;
    color: #a5b4fc;
  }

  .header-text h1 {
    font-size: 20px;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0 0 4px 0;
    background: linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .header-text p {
    font-size: 13px;
    color: #94a3b8;
    margin: 0;
  }

  /* Main Content */
  .contact-main {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
  }

  .glass-card {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 16px;
    padding: 24px;
    box-shadow:
      0 4px 24px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  /* Footer */
  .contact-footer {
    padding: 20px 24px;
    border-top: 1px solid rgba(51, 65, 85, 0.5);
    background: rgba(15, 23, 42, 0.5);
  }

  .footer-text {
    font-size: 12px;
    color: #64748b;
    text-align: center;
    margin: 0 0 12px 0;
  }

  .social-links {
    display: flex;
    justify-content: center;
    gap: 16px;
  }

  .social-link {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(51, 65, 85, 0.5);
    border: 1px solid rgba(71, 85, 105, 0.5);
    border-radius: 10px;
    color: #94a3b8;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .social-link:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.5);
    color: #a5b4fc;
    transform: translateY(-2px);
  }

  /* Animations */
  .fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Scrollbar */
  .contact-main::-webkit-scrollbar {
    width: 6px;
  }

  .contact-main::-webkit-scrollbar-track {
    background: transparent;
  }

  .contact-main::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.3);
    border-radius: 3px;
  }

  .contact-main::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.5);
  }
</style>
