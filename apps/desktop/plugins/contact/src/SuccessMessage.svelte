<script lang="ts">
  /**
   * SuccessMessage - Thank You State Component
   *
   * Displays after successful form submission with:
   * - Animated success icon
   * - Thank you message
   * - Option to send another message
   */

  interface Props {
    onReset: () => void;
  }

  let { onReset }: Props = $props();
</script>

<div class="success-container">
  <!-- Animated Success Icon -->
  <div class="success-icon">
    <svg
      class="checkmark"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 52 52"
    >
      <circle
        class="checkmark-circle"
        cx="26"
        cy="26"
        r="25"
        fill="none"
      />
      <path
        class="checkmark-check"
        fill="none"
        d="M14.1 27.2l7.1 7.2 16.7-16.8"
      />
    </svg>
  </div>

  <!-- Success Message -->
  <div class="success-content">
    <h2 class="success-title">Message Sent!</h2>
    <p class="success-text">
      Thank you for reaching out. I'll get back to you as soon as possible.
    </p>
  </div>

  <!-- Actions -->
  <div class="success-actions">
    <button class="reset-btn" onclick={onReset}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m12 19-7-7 7-7"/>
        <path d="M19 12H5"/>
      </svg>
      Send Another Message
    </button>
  </div>

  <!-- Decorative Elements -->
  <div class="confetti">
    <div class="confetti-piece"></div>
    <div class="confetti-piece"></div>
    <div class="confetti-piece"></div>
    <div class="confetti-piece"></div>
    <div class="confetti-piece"></div>
    <div class="confetti-piece"></div>
  </div>
</div>

<style>
  .success-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 32px;
    text-align: center;
    position: relative;
    overflow: hidden;
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 16px;
    box-shadow:
      0 4px 24px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  /* Checkmark Animation */
  .success-icon {
    width: 80px;
    height: 80px;
    margin-bottom: 24px;
  }

  .checkmark {
    width: 80px;
    height: 80px;
  }

  .checkmark-circle {
    stroke-dasharray: 166;
    stroke-dashoffset: 166;
    stroke-width: 2;
    stroke-miterlimit: 10;
    stroke: #4ade80;
    animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
  }

  .checkmark-check {
    transform-origin: 50% 50%;
    stroke-dasharray: 48;
    stroke-dashoffset: 48;
    stroke-width: 3;
    stroke-linecap: round;
    stroke: #4ade80;
    animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
  }

  @keyframes stroke {
    100% {
      stroke-dashoffset: 0;
    }
  }

  /* Content */
  .success-content {
    margin-bottom: 32px;
  }

  .success-title {
    font-size: 24px;
    font-weight: 700;
    color: #4ade80;
    margin: 0 0 12px 0;
    animation: fadeInUp 0.5s ease 0.4s both;
  }

  .success-text {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
    max-width: 300px;
    line-height: 1.6;
    animation: fadeInUp 0.5s ease 0.5s both;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Actions */
  .success-actions {
    animation: fadeInUp 0.5s ease 0.6s both;
  }

  .reset-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: rgba(71, 85, 105, 0.5);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 10px;
    color: #a5b4fc;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .reset-btn:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.5);
    transform: translateY(-1px);
  }

  .reset-btn:active {
    transform: translateY(0);
  }

  /* Confetti Animation */
  .confetti {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .confetti-piece {
    position: absolute;
    width: 10px;
    height: 10px;
    background: linear-gradient(135deg, #6366f1, #4ade80);
    opacity: 0;
    animation: confettiFall 2s ease-out forwards;
  }

  .confetti-piece:nth-child(1) {
    left: 10%;
    animation-delay: 0s;
    transform: rotate(15deg);
  }

  .confetti-piece:nth-child(2) {
    left: 25%;
    animation-delay: 0.1s;
    transform: rotate(45deg);
    background: #4ade80;
  }

  .confetti-piece:nth-child(3) {
    left: 40%;
    animation-delay: 0.2s;
    transform: rotate(-15deg);
    background: #a5b4fc;
  }

  .confetti-piece:nth-child(4) {
    left: 60%;
    animation-delay: 0.15s;
    transform: rotate(30deg);
  }

  .confetti-piece:nth-child(5) {
    left: 75%;
    animation-delay: 0.25s;
    transform: rotate(-30deg);
    background: #fbbf24;
  }

  .confetti-piece:nth-child(6) {
    left: 90%;
    animation-delay: 0.05s;
    transform: rotate(60deg);
    background: #f87171;
  }

  @keyframes confettiFall {
    0% {
      opacity: 1;
      top: -10%;
      transform: translateX(0) rotate(0deg);
    }
    100% {
      opacity: 0;
      top: 100%;
      transform: translateX(20px) rotate(360deg);
    }
  }
</style>
