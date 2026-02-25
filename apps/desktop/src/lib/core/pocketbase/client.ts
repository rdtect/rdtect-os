/**
 * PocketBase Client Wrapper
 *
 * Provides a typed wrapper around the PocketBase SDK with:
 * - Singleton client instance
 * - Type-safe collection methods
 * - Auth state management with Svelte stores
 * - File URL helpers
 * - Real-time subscriptions
 */

import PocketBase, { type RecordSubscription, type UnsubscribeFunc } from 'pocketbase';
import type {
  User,
  UserCreate,
  UserUpdate,
  Project,
  ProjectCreate,
  ProjectUpdate,
  BlogPost,
  BlogPostCreate,
  BlogPostUpdate,
  ContactMessage,
  ContactMessageCreate,
  ContactMessageUpdate,
  AppSettings,
  AppSettingsCreate,
  AppSettingsUpdate,
  AppSettingsValue,
  FileMetadata,
  FileMetadataCreate,
  FileMetadataUpdate,
  ListResult,
  QueryOptions,
  AuthResponse,
  AuthState,
  LoginCredentials,
  OAuth2Provider,
  FileUrlOptions,
  BaseRecord,
  CollectionName
} from './types';
import { Collections } from './types';

// ============================================
// Configuration
// ============================================

/**
 * PocketBase server URL - uses environment variable or default
 */
const POCKETBASE_URL = import.meta.env?.VITE_POCKETBASE_URL || 'http://localhost:8090';

// ============================================
// Singleton Client
// ============================================

let pbInstance: PocketBase | null = null;

/**
 * Get or create the PocketBase client singleton
 */
export function getPocketBase(): PocketBase {
  if (!pbInstance) {
    pbInstance = new PocketBase(POCKETBASE_URL);

    // Enable auto-cancellation for pending requests
    pbInstance.autoCancellation(false);
  }
  return pbInstance;
}

/**
 * Get the raw PocketBase client instance
 */
export const pb = getPocketBase();

// ============================================
// Auth State (Reactive)
// ============================================

/**
 * Get current auth state
 */
export function getAuthState(): AuthState {
  const client = getPocketBase();
  return {
    isValid: client.authStore.isValid,
    token: client.authStore.token,
    model: (client.authStore.record as User | null) ?? null
  };
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (state: AuthState) => void): () => void {
  const client = getPocketBase();
  return client.authStore.onChange(() => {
    callback(getAuthState());
  });
}

/**
 * Clear auth state (logout)
 */
export function clearAuth(): void {
  getPocketBase().authStore.clear();
}

// ============================================
// Auth Methods
// ============================================

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const client = getPocketBase();
  const response = await client.collection(Collections.USERS).authWithPassword(
    credentials.email,
    credentials.password
  );
  return {
    token: response.token,
    record: response.record as User
  };
}

/**
 * Register a new user
 */
export async function register(data: UserCreate): Promise<AuthResponse> {
  const client = getPocketBase();

  // Create the user
  await client.collection(Collections.USERS).create(data);

  // Login with the new credentials
  return login({ email: data.email, password: data.password });
}

/**
 * Login with OAuth2 provider
 */
export async function loginWithOAuth2(provider: OAuth2Provider): Promise<AuthResponse> {
  const client = getPocketBase();
  const response = await client.collection(Collections.USERS).authWithOAuth2({ provider });
  return {
    token: response.token,
    record: response.record as User
  };
}

/**
 * Refresh auth token
 */
export async function refreshAuth(): Promise<AuthResponse> {
  const client = getPocketBase();
  const response = await client.collection(Collections.USERS).authRefresh();
  return {
    token: response.token,
    record: response.record as User
  };
}

/**
 * Request password reset email
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const client = getPocketBase();
  await client.collection(Collections.USERS).requestPasswordReset(email);
}

/**
 * Request email verification
 */
export async function requestEmailVerification(email: string): Promise<void> {
  const client = getPocketBase();
  await client.collection(Collections.USERS).requestVerification(email);
}

// ============================================
// Generic Collection Methods
// ============================================

/**
 * Generic typed collection accessor
 */
export function collection<T extends BaseRecord>(name: CollectionName) {
  const client = getPocketBase();

  return {
    /**
     * Get a single record by ID
     */
    async getOne(id: string, options?: QueryOptions): Promise<T> {
      return client.collection(name).getOne<T>(id, options);
    },

    /**
     * Get a list of records
     */
    async getList(page = 1, perPage = 20, options?: QueryOptions): Promise<ListResult<T>> {
      return client.collection(name).getList<T>(page, perPage, options);
    },

    /**
     * Get all records (auto-paginated)
     */
    async getFullList(options?: QueryOptions): Promise<T[]> {
      return client.collection(name).getFullList<T>(options);
    },

    /**
     * Get first record matching filter
     */
    async getFirstListItem(filter: string, options?: QueryOptions): Promise<T> {
      return client.collection(name).getFirstListItem<T>(filter, options);
    },

    /**
     * Create a new record
     */
    async create(data: Record<string, unknown>): Promise<T> {
      return client.collection(name).create<T>(data);
    },

    /**
     * Update an existing record
     */
    async update(id: string, data: Record<string, unknown>): Promise<T> {
      return client.collection(name).update<T>(id, data);
    },

    /**
     * Delete a record
     */
    async delete(id: string): Promise<boolean> {
      return client.collection(name).delete(id);
    },

    /**
     * Subscribe to real-time changes
     */
    subscribe(
      topic: string,
      callback: (data: RecordSubscription<T>) => void
    ): Promise<UnsubscribeFunc> {
      return client.collection(name).subscribe<T>(topic, callback);
    },

    /**
     * Unsubscribe from all subscriptions on this collection
     */
    unsubscribe(topic?: string): Promise<void> {
      return client.collection(name).unsubscribe(topic);
    }
  };
}

// ============================================
// Typed Collection Accessors
// ============================================

/**
 * Users collection
 */
export const users = {
  ...collection<User>(Collections.USERS),

  async getCurrent(): Promise<User | null> {
    const state = getAuthState();
    return state.model;
  },

  async update(id: string, data: UserUpdate): Promise<User> {
    return collection<User>(Collections.USERS).update(id, data as Record<string, unknown>);
  }
};

/**
 * Projects collection
 */
export const projects = {
  ...collection<Project>(Collections.PROJECTS),

  async create(data: ProjectCreate): Promise<Project> {
    const client = getPocketBase();
    const user = getAuthState().model;
    if (!user) throw new Error('Authentication required');

    return client.collection(Collections.PROJECTS).create<Project>({
      ...data,
      user: user.id
    });
  },

  async update(id: string, data: ProjectUpdate): Promise<Project> {
    return collection<Project>(Collections.PROJECTS).update(id, data as Record<string, unknown>);
  },

  async getBySlug(slug: string): Promise<Project> {
    return collection<Project>(Collections.PROJECTS).getFirstListItem(`slug = "${slug}"`);
  },

  async getFeatured(): Promise<Project[]> {
    return collection<Project>(Collections.PROJECTS).getFullList({
      filter: 'featured = true && status = "published"',
      sort: 'order'
    });
  },

  async getPublished(): Promise<Project[]> {
    return collection<Project>(Collections.PROJECTS).getFullList({
      filter: 'status = "published"',
      sort: '-created'
    });
  }
};

/**
 * Blog posts collection
 */
export const blogPosts = {
  ...collection<BlogPost>(Collections.BLOG_POSTS),

  async create(data: BlogPostCreate): Promise<BlogPost> {
    const client = getPocketBase();
    const user = getAuthState().model;
    if (!user) throw new Error('Authentication required');

    return client.collection(Collections.BLOG_POSTS).create<BlogPost>({
      ...data,
      user: user.id
    });
  },

  async update(id: string, data: BlogPostUpdate): Promise<BlogPost> {
    return collection<BlogPost>(Collections.BLOG_POSTS).update(id, data as Record<string, unknown>);
  },

  async getBySlug(slug: string): Promise<BlogPost> {
    return collection<BlogPost>(Collections.BLOG_POSTS).getFirstListItem(`slug = "${slug}"`);
  },

  async getPublished(page = 1, perPage = 10): Promise<ListResult<BlogPost>> {
    return collection<BlogPost>(Collections.BLOG_POSTS).getList(page, perPage, {
      filter: 'status = "published"',
      sort: '-published_at'
    });
  },

  async getByTag(tag: string): Promise<BlogPost[]> {
    return collection<BlogPost>(Collections.BLOG_POSTS).getFullList({
      filter: `status = "published" && tags ~ "${tag}"`,
      sort: '-published_at'
    });
  }
};

/**
 * Contact messages collection
 */
export const contactMessages = {
  ...collection<ContactMessage>(Collections.CONTACT_MESSAGES),

  async submit(data: ContactMessageCreate): Promise<ContactMessage> {
    const client = getPocketBase();
    return client.collection(Collections.CONTACT_MESSAGES).create<ContactMessage>({
      ...data,
      status: 'new'
    });
  },

  async markAsRead(id: string): Promise<ContactMessage> {
    return collection<ContactMessage>(Collections.CONTACT_MESSAGES).update(id, { status: 'read' });
  },

  async markAsReplied(id: string): Promise<ContactMessage> {
    return collection<ContactMessage>(Collections.CONTACT_MESSAGES).update(id, { status: 'replied' });
  },

  async getUnread(): Promise<ContactMessage[]> {
    return collection<ContactMessage>(Collections.CONTACT_MESSAGES).getFullList({
      filter: 'status = "new"',
      sort: '-created'
    });
  }
};

/**
 * App settings collection
 */
export const appSettings = {
  ...collection<AppSettings>(Collections.APP_SETTINGS),

  async get<T extends AppSettingsValue>(appId: string): Promise<T | null> {
    const user = getAuthState().model;
    if (!user) return null;

    try {
      const record = await collection<AppSettings<T>>(Collections.APP_SETTINGS).getFirstListItem(
        `user = "${user.id}" && app_id = "${appId}"`
      );
      return record.settings;
    } catch {
      return null;
    }
  },

  async set<T extends AppSettingsValue>(appId: string, settings: T): Promise<AppSettings<T>> {
    const client = getPocketBase();
    const user = getAuthState().model;
    if (!user) throw new Error('Authentication required');

    // Check if settings exist
    try {
      const existing = await collection<AppSettings<T>>(Collections.APP_SETTINGS).getFirstListItem(
        `user = "${user.id}" && app_id = "${appId}"`
      );
      // Update existing
      return client.collection(Collections.APP_SETTINGS).update<AppSettings<T>>(existing.id, {
        settings
      });
    } catch {
      // Create new
      return client.collection(Collections.APP_SETTINGS).create<AppSettings<T>>({
        user: user.id,
        app_id: appId,
        settings
      });
    }
  },

  async delete(appId: string): Promise<void> {
    const user = getAuthState().model;
    if (!user) throw new Error('Authentication required');

    try {
      const existing = await collection<AppSettings>(Collections.APP_SETTINGS).getFirstListItem(
        `user = "${user.id}" && app_id = "${appId}"`
      );
      await collection<AppSettings>(Collections.APP_SETTINGS).delete(existing.id);
    } catch {
      // Settings don't exist, nothing to delete
    }
  }
};

/**
 * Files metadata collection (VFS sync)
 */
export const filesMetadata = {
  ...collection<FileMetadata>(Collections.FILES_METADATA),

  async create(data: FileMetadataCreate): Promise<FileMetadata> {
    const client = getPocketBase();
    const user = getAuthState().model;
    if (!user) throw new Error('Authentication required');

    return client.collection(Collections.FILES_METADATA).create<FileMetadata>({
      ...data,
      user: user.id,
      synced_at: new Date().toISOString()
    });
  },

  async update(id: string, data: FileMetadataUpdate): Promise<FileMetadata> {
    return collection<FileMetadata>(Collections.FILES_METADATA).update(id, {
      ...data,
      synced_at: new Date().toISOString()
    });
  },

  async getByPath(path: string): Promise<FileMetadata | null> {
    const user = getAuthState().model;
    if (!user) return null;

    try {
      return await collection<FileMetadata>(Collections.FILES_METADATA).getFirstListItem(
        `user = "${user.id}" && path = "${path}"`
      );
    } catch {
      return null;
    }
  },

  async listDirectory(parentPath: string): Promise<FileMetadata[]> {
    const user = getAuthState().model;
    if (!user) return [];

    return collection<FileMetadata>(Collections.FILES_METADATA).getFullList({
      filter: `user = "${user.id}" && parent_path = "${parentPath}"`,
      sort: 'is_directory,name'
    });
  },

  async deleteByPath(path: string): Promise<void> {
    const metadata = await this.getByPath(path);
    if (metadata) {
      await collection<FileMetadata>(Collections.FILES_METADATA).delete(metadata.id);
    }
  }
};

// ============================================
// File URL Helpers
// ============================================

/**
 * Get the URL for a file stored in a record
 */
export function getFileUrl(
  record: BaseRecord,
  filename: string,
  options?: FileUrlOptions
): string {
  const client = getPocketBase();
  return client.files.getURL(record, filename, options);
}

/**
 * Get the URL for a user's avatar
 */
export function getAvatarUrl(user: User, options?: FileUrlOptions): string | null {
  if (!user.avatar) return null;
  return getFileUrl(user, user.avatar, options);
}

/**
 * Get the URL for a project's thumbnail
 */
export function getThumbnailUrl(project: Project, options?: FileUrlOptions): string | null {
  if (!project.thumbnail) return null;
  return getFileUrl(project, project.thumbnail, options);
}

/**
 * Get URLs for a project's screenshots
 */
export function getScreenshotUrls(project: Project, options?: FileUrlOptions): string[] {
  if (!project.screenshots || project.screenshots.length === 0) return [];
  return project.screenshots.map((filename) => getFileUrl(project, filename, options));
}

/**
 * Get the URL for a blog post's cover image
 */
export function getCoverImageUrl(post: BlogPost, options?: FileUrlOptions): string | null {
  if (!post.cover_image) return null;
  return getFileUrl(post, post.cover_image, options);
}

// ============================================
// Utility Exports
// ============================================

export { POCKETBASE_URL };
