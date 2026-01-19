/**
 * TypeScript declarations for Module Federation remotes
 * These declarations allow TypeScript to understand dynamic imports of federated modules
 */

declare module 'ai-chat/Chat' {
  import type { Component } from 'svelte';

  interface ChatProps {
    windowId?: string;
  }

  const Chat: Component<ChatProps>;
  export default Chat;
}

// Generic module declaration for any federation remote
declare module 'ai-chat/*' {
  const component: import('svelte').Component;
  export default component;
}

declare module 'prompt-manager/PromptManager' {
  import type { Component } from 'svelte';

  interface PromptManagerProps {
    windowId?: string;
  }

  const PromptManager: Component<PromptManagerProps>;
  export default PromptManager;
}

// Generic module declaration for prompt-manager remote
declare module 'prompt-manager/*' {
  const component: import('svelte').Component;
  export default component;
}
