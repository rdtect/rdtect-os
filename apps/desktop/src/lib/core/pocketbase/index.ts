/**
 * PocketBase Module - Main Entry Point
 *
 * Provides the complete PocketBase integration for rdtect OS:
 * - Type definitions for all collections
 * - Client wrapper with typed methods
 * - Auth state management
 * - File URL helpers
 * - Real-time subscriptions
 *
 * @example
 * ```ts
 * import { pb, login, projects, getAuthState } from '$lib/core/pocketbase';
 *
 * // Login
 * await login({ email: 'user@example.com', password: 'password' });
 *
 * // Get current auth state
 * const auth = getAuthState();
 * console.log(auth.model?.name);
 *
 * // Fetch projects
 * const published = await projects.getPublished();
 *
 * // Create a project
 * const project = await projects.create({
 *   title: 'My Project',
 *   slug: 'my-project',
 *   description: 'A great project',
 *   status: 'draft'
 * });
 * ```
 */

// Re-export all types
export * from './types';

// Re-export client functions and collections
export {
  // Singleton client
  pb,
  getPocketBase,
  POCKETBASE_URL,

  // Auth state
  getAuthState,
  onAuthStateChange,
  clearAuth,

  // Auth methods
  login,
  register,
  loginWithOAuth2,
  refreshAuth,
  requestPasswordReset,
  requestEmailVerification,

  // Generic collection accessor
  collection,

  // Typed collection accessors
  users,
  projects,
  blogPosts,
  contactMessages,
  appSettings,
  filesMetadata,

  // File URL helpers
  getFileUrl,
  getAvatarUrl,
  getThumbnailUrl,
  getScreenshotUrls,
  getCoverImageUrl
} from './client';
