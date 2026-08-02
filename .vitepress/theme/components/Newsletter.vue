<template>
  <div class="newsletter-container">
    <h3 class="newsletter-title">Subscribe to ATRVASA Updates</h3>
    <p class="newsletter-desc">
      Get the latest engineering deep dives on eBPF, Rust, and Zero-Trust architecture directly in your inbox.
    </p>
    
    <form 
      class="newsletter-form" 
      action="https://buttondown.email/api/emails/embed-subscribe/atrvasa" 
      method="post" 
      target="popupwindow" 
      @submit="handleFormSubmit"
    >
      <input 
        type="email" 
        name="email" 
        id="bd-email" 
        v-model="emailInput"
        placeholder="sysadmin@example.com" 
        required 
        class="newsletter-input"
      />
      <input type="hidden" name="embed" value="1" />
      
      <button type="submit" class="newsletter-btn">
        Subscribe
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// State for the email input
const emailInput = ref('')

/**
 * Handles the form submission event.
 * Opens a minimal popup window to process the external subscription 
 * without navigating the user away from the documentation site.
 */
const handleFormSubmit = () => {
  window.open('https://buttondown.email/atrvasa', 'popupwindow', 'scrollbars=yes,width=800,height=600');
  // Optional: You can reset the input after submission or show a local success message.
  // emailInput.value = '';
}
</script>

<style scoped>
/* * Minimalistic styling matching a developer-focused VitePress theme.
 * Uses CSS variables provided by the default VitePress theme.
 */
.newsletter-container {
  margin: 2rem 0;
  padding: 1.5rem;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.newsletter-title {
  margin: 0 0 0.5rem;
  font-weight: 600;
  font-size: 1.2rem;
  color: var(--vp-c-text-1);
}

.newsletter-desc {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.newsletter-form {
  display: flex;
  gap: 0.5rem;
}

.newsletter-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: inherit;
}

.newsletter-input:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.newsletter-btn {
  padding: 0.5rem 1rem;
  background-color: var(--vp-c-brand);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.newsletter-btn:hover {
  background-color: var(--vp-c-brand-dark);
}

/* Responsive adjustment for mobile devices */
@media (max-width: 640px) {
  .newsletter-form {
    flex-direction: column;
  }
}
</style>