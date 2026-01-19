<script lang="ts">
  /**
   * ContactForm - Form Component with Validation
   *
   * Features:
   * - Client-side validation
   * - Floating labels / clean input design
   * - Honeypot anti-spam field
   * - Loading spinner on submit
   * - Error display
   */

  interface Props {
    onSubmit: (data: FormData) => void;
    isSubmitting: boolean;
    errorMessage?: string;
  }

  interface FormData {
    name: string;
    email: string;
    subject: string;
    message: string;
  }

  interface ValidationErrors {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  }

  let { onSubmit, isSubmitting, errorMessage = '' }: Props = $props();

  // Form fields
  let name = $state('');
  let email = $state('');
  let subject = $state('');
  let message = $state('');
  let honeypot = $state(''); // Anti-spam honeypot field

  // Validation state
  let errors = $state<ValidationErrors>({});
  let touched = $state<Record<string, boolean>>({});

  // Validation functions
  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function validateField(field: string, value: string): string | undefined {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        break;
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!validateEmail(value)) return 'Please enter a valid email';
        break;
      case 'subject':
        if (!value.trim()) return 'Subject is required';
        if (value.trim().length < 3) return 'Subject must be at least 3 characters';
        break;
      case 'message':
        if (!value.trim()) return 'Message is required';
        if (value.trim().length < 10) return 'Message must be at least 10 characters';
        break;
    }
    return undefined;
  }

  function handleBlur(field: string) {
    touched[field] = true;
    const value = { name, email, subject, message }[field] || '';
    errors[field as keyof ValidationErrors] = validateField(field, value);
  }

  function validateForm(): boolean {
    const newErrors: ValidationErrors = {
      name: validateField('name', name),
      email: validateField('email', email),
      subject: validateField('subject', subject),
      message: validateField('message', message),
    };

    errors = newErrors;
    touched = { name: true, email: true, subject: true, message: true };

    return !Object.values(newErrors).some((e) => e);
  }

  function handleSubmit(e: Event) {
    e.preventDefault();

    // Check honeypot - if filled, it's likely a bot
    if (honeypot) {
      console.log('Bot detected via honeypot');
      return;
    }

    if (!validateForm()) {
      return;
    }

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });
  }

  // Derived state for field validity
  const isNameValid = $derived(!errors.name || !touched.name);
  const isEmailValid = $derived(!errors.email || !touched.email);
  const isSubjectValid = $derived(!errors.subject || !touched.subject);
  const isMessageValid = $derived(!errors.message || !touched.message);
</script>

<form class="contact-form" onsubmit={handleSubmit}>
  <!-- Honeypot field - hidden from users, catches bots -->
  <div class="honeypot" aria-hidden="true">
    <label for="website">Website</label>
    <input
      type="text"
      id="website"
      name="website"
      bind:value={honeypot}
      tabindex="-1"
      autocomplete="off"
    />
  </div>

  <!-- Name Field -->
  <div class="form-group" class:has-error={!isNameValid}>
    <label for="name" class="form-label">
      <span class="label-text">Name</span>
      <span class="required">*</span>
    </label>
    <input
      type="text"
      id="name"
      name="name"
      class="form-input"
      placeholder="Your name"
      bind:value={name}
      onblur={() => handleBlur('name')}
      disabled={isSubmitting}
      required
    />
    {#if touched.name && errors.name}
      <span class="error-text">{errors.name}</span>
    {/if}
  </div>

  <!-- Email Field -->
  <div class="form-group" class:has-error={!isEmailValid}>
    <label for="email" class="form-label">
      <span class="label-text">Email</span>
      <span class="required">*</span>
    </label>
    <input
      type="email"
      id="email"
      name="email"
      class="form-input"
      placeholder="your.email@example.com"
      bind:value={email}
      onblur={() => handleBlur('email')}
      disabled={isSubmitting}
      required
    />
    {#if touched.email && errors.email}
      <span class="error-text">{errors.email}</span>
    {/if}
  </div>

  <!-- Subject Field -->
  <div class="form-group" class:has-error={!isSubjectValid}>
    <label for="subject" class="form-label">
      <span class="label-text">Subject</span>
      <span class="required">*</span>
    </label>
    <input
      type="text"
      id="subject"
      name="subject"
      class="form-input"
      placeholder="What is this about?"
      bind:value={subject}
      onblur={() => handleBlur('subject')}
      disabled={isSubmitting}
      required
    />
    {#if touched.subject && errors.subject}
      <span class="error-text">{errors.subject}</span>
    {/if}
  </div>

  <!-- Message Field -->
  <div class="form-group" class:has-error={!isMessageValid}>
    <label for="message" class="form-label">
      <span class="label-text">Message</span>
      <span class="required">*</span>
    </label>
    <textarea
      id="message"
      name="message"
      class="form-input form-textarea"
      placeholder="Tell me about your project, question, or just say hello..."
      bind:value={message}
      onblur={() => handleBlur('message')}
      disabled={isSubmitting}
      rows="5"
      required
    ></textarea>
    {#if touched.message && errors.message}
      <span class="error-text">{errors.message}</span>
    {/if}
  </div>

  <!-- Error Banner -->
  {#if errorMessage}
    <div class="error-banner">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{errorMessage}</span>
    </div>
  {/if}

  <!-- Submit Button -->
  <button type="submit" class="submit-btn" disabled={isSubmitting}>
    {#if isSubmitting}
      <span class="spinner"></span>
      <span>Sending...</span>
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m22 2-7 20-4-9-9-4Z"/>
        <path d="M22 2 11 13"/>
      </svg>
      <span>Send Message</span>
    {/if}
  </button>
</form>

<style>
  .contact-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Honeypot - hidden from users */
  .honeypot {
    position: absolute;
    left: -9999px;
    opacity: 0;
    pointer-events: none;
  }

  /* Form Group */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 500;
    color: #94a3b8;
  }

  .label-text {
    transition: color 0.2s ease;
  }

  .required {
    color: #f87171;
    font-size: 11px;
  }

  /* Input Styles */
  .form-input {
    width: 100%;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(71, 85, 105, 0.5);
    border-radius: 10px;
    padding: 12px 16px;
    color: #f1f5f9;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: all 0.2s ease;
  }

  .form-input::placeholder {
    color: #475569;
  }

  .form-input:focus {
    border-color: rgba(99, 102, 241, 0.6);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    background: rgba(15, 23, 42, 0.8);
  }

  .form-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .form-textarea {
    min-height: 120px;
    resize: vertical;
    line-height: 1.6;
  }

  /* Error State */
  .has-error .form-input {
    border-color: rgba(248, 113, 113, 0.6);
  }

  .has-error .form-input:focus {
    border-color: rgba(248, 113, 113, 0.8);
    box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.15);
  }

  .has-error .label-text {
    color: #f87171;
  }

  .error-text {
    font-size: 12px;
    color: #f87171;
    animation: slideIn 0.2s ease;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Error Banner */
  .error-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: rgba(248, 113, 113, 0.15);
    border: 1px solid rgba(248, 113, 113, 0.3);
    border-radius: 10px;
    color: #fca5a5;
    font-size: 13px;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* Submit Button */
  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 14px 24px;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    border: none;
    border-radius: 10px;
    color: white;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 8px;
  }

  .submit-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  /* Spinner */
  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
