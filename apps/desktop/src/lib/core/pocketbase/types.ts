/**
 * PocketBase TypeScript Type Definitions
 *
 * Generated from pb_schema.json
 * These types provide type safety for all PocketBase collections.
 */

// ============================================
// Base Types
// ============================================

/**
 * Base record fields present on all PocketBase records
 */
export interface BaseRecord {
  id: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: string;
}

/**
 * Base auth record fields (extends user collections)
 */
export interface AuthRecord extends BaseRecord {
  email: string;
  emailVisibility: boolean;
  verified: boolean;
  username: string;
}

// ============================================
// Social Links Type
// ============================================

/**
 * Social media links structure
 */
export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
  instagram?: string;
  youtube?: string;
  [key: string]: string | undefined;
}

// ============================================
// Users Collection (Auth)
// ============================================

/**
 * Extended user profile fields
 */
export interface UserProfile {
  name: string;
  avatar?: string;
  bio?: string;
  title?: string;
  social_links?: SocialLinks;
  resume_url?: string;
}

/**
 * Full user record (auth + profile)
 */
export interface User extends AuthRecord, UserProfile {}

/**
 * User creation payload
 */
export interface UserCreate {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  username?: string;
  avatar?: File;
  bio?: string;
  title?: string;
  social_links?: SocialLinks;
  resume_url?: string;
}

/**
 * User update payload
 */
export interface UserUpdate {
  name?: string;
  avatar?: File | null;
  bio?: string;
  title?: string;
  social_links?: SocialLinks;
  resume_url?: string;
  email?: string;
  oldPassword?: string;
  password?: string;
  passwordConfirm?: string;
}

// ============================================
// Projects Collection
// ============================================

/**
 * Project status enum
 */
export type ProjectStatus = 'draft' | 'published';

/**
 * Project record
 */
export interface Project extends BaseRecord {
  title: string;
  slug: string;
  description: string;
  long_description?: string;
  technologies?: string[];
  github_url?: string;
  live_url?: string;
  demo_url?: string;
  thumbnail?: string;
  screenshots?: string[];
  featured: boolean;
  order: number;
  status: ProjectStatus;
  user: string;

  // Expanded relation (when using expand)
  expand?: {
    user?: User;
  };
}

/**
 * Project creation payload
 */
export interface ProjectCreate {
  title: string;
  slug: string;
  description: string;
  long_description?: string;
  technologies?: string[];
  github_url?: string;
  live_url?: string;
  demo_url?: string;
  thumbnail?: File;
  screenshots?: File[];
  featured?: boolean;
  order?: number;
  status: ProjectStatus;
}

/**
 * Project update payload
 */
export interface ProjectUpdate {
  title?: string;
  slug?: string;
  description?: string;
  long_description?: string;
  technologies?: string[];
  github_url?: string;
  live_url?: string;
  demo_url?: string;
  thumbnail?: File | null;
  screenshots?: File[] | null;
  featured?: boolean;
  order?: number;
  status?: ProjectStatus;
}

// ============================================
// Blog Posts Collection
// ============================================

/**
 * Blog post status enum
 */
export type BlogPostStatus = 'draft' | 'published';

/**
 * Blog post record
 */
export interface BlogPost extends BaseRecord {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  tags?: string[];
  status: BlogPostStatus;
  published_at?: string;
  user: string;

  // Expanded relation
  expand?: {
    user?: User;
  };
}

/**
 * Blog post creation payload
 */
export interface BlogPostCreate {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: File;
  tags?: string[];
  status: BlogPostStatus;
  published_at?: string;
}

/**
 * Blog post update payload
 */
export interface BlogPostUpdate {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  cover_image?: File | null;
  tags?: string[];
  status?: BlogPostStatus;
  published_at?: string;
}

// ============================================
// Contact Messages Collection
// ============================================

/**
 * Contact message status enum
 */
export type ContactMessageStatus = 'new' | 'read' | 'replied';

/**
 * Contact message record
 */
export interface ContactMessage extends BaseRecord {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
}

/**
 * Contact message creation payload (public form)
 */
export interface ContactMessageCreate {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Contact message update payload (admin only)
 */
export interface ContactMessageUpdate {
  status?: ContactMessageStatus;
}

// ============================================
// App Settings Collection
// ============================================

/**
 * Generic app settings value type
 */
export type AppSettingsValue = Record<string, unknown>;

/**
 * App settings record
 */
export interface AppSettings<T extends AppSettingsValue = AppSettingsValue> extends BaseRecord {
  user: string;
  app_id: string;
  settings: T;

  // Expanded relation
  expand?: {
    user?: User;
  };
}

/**
 * App settings creation payload
 */
export interface AppSettingsCreate<T extends AppSettingsValue = AppSettingsValue> {
  app_id: string;
  settings: T;
}

/**
 * App settings update payload
 */
export interface AppSettingsUpdate<T extends AppSettingsValue = AppSettingsValue> {
  settings: T;
}

// ============================================
// Files Metadata Collection (VFS Sync)
// ============================================

/**
 * File metadata record
 */
export interface FileMetadata extends BaseRecord {
  path: string;
  name: string;
  mime_type?: string;
  size?: number;
  user: string;
  synced_at?: string;
  checksum?: string;
  is_directory: boolean;
  parent_path?: string;

  // Expanded relation
  expand?: {
    user?: User;
  };
}

/**
 * File metadata creation payload
 */
export interface FileMetadataCreate {
  path: string;
  name: string;
  mime_type?: string;
  size?: number;
  checksum?: string;
  is_directory?: boolean;
  parent_path?: string;
}

/**
 * File metadata update payload
 */
export interface FileMetadataUpdate {
  mime_type?: string;
  size?: number;
  synced_at?: string;
  checksum?: string;
}

// ============================================
// Collection Names & Mapping
// ============================================

/**
 * Collection name constants
 */
export const Collections = {
  USERS: 'users',
  PROJECTS: 'projects',
  BLOG_POSTS: 'blog_posts',
  CONTACT_MESSAGES: 'contact_messages',
  APP_SETTINGS: 'app_settings',
  FILES_METADATA: 'files_metadata'
} as const;

export type CollectionName = (typeof Collections)[keyof typeof Collections];

/**
 * Map collection names to their record types
 */
export interface CollectionRecordMap {
  users: User;
  projects: Project;
  blog_posts: BlogPost;
  contact_messages: ContactMessage;
  app_settings: AppSettings;
  files_metadata: FileMetadata;
}

// ============================================
// List/Query Response Types
// ============================================

/**
 * Paginated list response
 */
export interface ListResult<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

/**
 * Query filter options
 */
export interface QueryOptions {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  expand?: string;
  fields?: string;
}

// ============================================
// Auth Types
// ============================================

/**
 * Auth response after login/register
 */
export interface AuthResponse {
  token: string;
  record: User;
}

/**
 * Auth state
 */
export interface AuthState {
  isValid: boolean;
  token: string;
  model: User | null;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * OAuth2 provider names supported by PocketBase
 */
export type OAuth2Provider =
  | 'google'
  | 'github'
  | 'gitlab'
  | 'discord'
  | 'twitter'
  | 'facebook'
  | 'microsoft'
  | 'spotify'
  | 'kakao'
  | 'apple'
  | 'instagram'
  | 'strava'
  | 'vk'
  | 'yandex'
  | 'patreon'
  | 'mailcow'
  | 'bitbucket'
  | 'planningcenter'
  | 'linear'
  | 'notion';

// ============================================
// File URL Helpers
// ============================================

/**
 * File URL options for thumb generation
 */
export interface FileUrlOptions {
  thumb?: string; // e.g., "100x100", "200x200"
}
