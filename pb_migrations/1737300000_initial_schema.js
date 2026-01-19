/// <reference path="../pb_data/types.d.ts" />
/**
 * Initial PocketBase Schema Migration
 *
 * Creates the foundational collections for rdtect OS:
 * - users (auth): Extended user profiles
 * - projects: Portfolio projects
 * - blog_posts: Blog content
 * - contact_messages: Contact form submissions
 * - app_settings: Per-user app preferences
 * - files_metadata: VFS sync metadata
 */

migrate((db) => {
  // ============================================
  // Users Collection (extends auth)
  // ============================================
  const users = new Collection({
    id: "users",
    name: "users",
    type: "auth",
    system: false,
    schema: [
      {
        id: "name_field",
        name: "name",
        type: "text",
        required: true,
        options: { min: 1, max: 100 }
      },
      {
        id: "avatar_field",
        name: "avatar",
        type: "file",
        required: false,
        options: {
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          thumbs: ["100x100", "200x200"]
        }
      },
      {
        id: "bio_field",
        name: "bio",
        type: "text",
        required: false,
        options: { max: 2000 }
      },
      {
        id: "title_field",
        name: "title",
        type: "text",
        required: false,
        options: { max: 100 }
      },
      {
        id: "social_links_field",
        name: "social_links",
        type: "json",
        required: false
      },
      {
        id: "resume_url_field",
        name: "resume_url",
        type: "url",
        required: false
      }
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "@request.auth.id = id",
    deleteRule: "@request.auth.id = id",
    options: {
      allowEmailAuth: true,
      allowOAuth2Auth: true,
      allowUsernameAuth: true,
      minPasswordLength: 8,
      requireEmail: false
    }
  });

  return Dao(db).saveCollection(users);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("users");
  return dao.deleteCollection(collection);
});

migrate((db) => {
  // ============================================
  // Projects Collection
  // ============================================
  const projects = new Collection({
    id: "projects",
    name: "projects",
    type: "base",
    schema: [
      {
        id: "title_field",
        name: "title",
        type: "text",
        required: true,
        options: { min: 1, max: 200 }
      },
      {
        id: "slug_field",
        name: "slug",
        type: "text",
        required: true,
        options: { min: 1, max: 200, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }
      },
      {
        id: "description_field",
        name: "description",
        type: "text",
        required: true,
        options: { min: 1, max: 500 }
      },
      {
        id: "long_description_field",
        name: "long_description",
        type: "editor",
        required: false
      },
      {
        id: "technologies_field",
        name: "technologies",
        type: "json",
        required: false
      },
      {
        id: "github_url_field",
        name: "github_url",
        type: "url",
        required: false
      },
      {
        id: "live_url_field",
        name: "live_url",
        type: "url",
        required: false
      },
      {
        id: "demo_url_field",
        name: "demo_url",
        type: "url",
        required: false
      },
      {
        id: "thumbnail_field",
        name: "thumbnail",
        type: "file",
        required: false,
        options: {
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          thumbs: ["200x200", "400x300", "800x600"]
        }
      },
      {
        id: "screenshots_field",
        name: "screenshots",
        type: "file",
        required: false,
        options: {
          maxSelect: 10,
          maxSize: 10485760,
          mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          thumbs: ["400x300", "800x600", "1200x900"]
        }
      },
      {
        id: "featured_field",
        name: "featured",
        type: "bool",
        required: false
      },
      {
        id: "order_field",
        name: "order",
        type: "number",
        required: false,
        options: { min: 0 }
      },
      {
        id: "status_field",
        name: "status",
        type: "select",
        required: true,
        options: { maxSelect: 1, values: ["draft", "published"] }
      },
      {
        id: "user_field",
        name: "user",
        type: "relation",
        required: true,
        options: {
          collectionId: "users",
          cascadeDelete: false,
          maxSelect: 1,
          displayFields: ["name", "email"]
        }
      }
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_projects_slug` ON `projects` (`slug`)",
      "CREATE INDEX `idx_projects_status` ON `projects` (`status`)",
      "CREATE INDEX `idx_projects_featured` ON `projects` (`featured`)",
      "CREATE INDEX `idx_projects_order` ON `projects` (`order`)"
    ],
    listRule: "status = 'published' || @request.auth.id = user",
    viewRule: "status = 'published' || @request.auth.id = user",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = user",
    deleteRule: "@request.auth.id = user"
  });

  return Dao(db).saveCollection(projects);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("projects");
  return dao.deleteCollection(collection);
});

migrate((db) => {
  // ============================================
  // Blog Posts Collection
  // ============================================
  const blogPosts = new Collection({
    id: "blog_posts",
    name: "blog_posts",
    type: "base",
    schema: [
      {
        id: "title_field",
        name: "title",
        type: "text",
        required: true,
        options: { min: 1, max: 300 }
      },
      {
        id: "slug_field",
        name: "slug",
        type: "text",
        required: true,
        options: { min: 1, max: 300, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }
      },
      {
        id: "content_field",
        name: "content",
        type: "editor",
        required: true
      },
      {
        id: "excerpt_field",
        name: "excerpt",
        type: "text",
        required: false,
        options: { max: 500 }
      },
      {
        id: "cover_image_field",
        name: "cover_image",
        type: "file",
        required: false,
        options: {
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          thumbs: ["400x300", "800x600", "1200x630"]
        }
      },
      {
        id: "tags_field",
        name: "tags",
        type: "json",
        required: false
      },
      {
        id: "status_field",
        name: "status",
        type: "select",
        required: true,
        options: { maxSelect: 1, values: ["draft", "published"] }
      },
      {
        id: "published_at_field",
        name: "published_at",
        type: "date",
        required: false
      },
      {
        id: "user_field",
        name: "user",
        type: "relation",
        required: true,
        options: {
          collectionId: "users",
          cascadeDelete: false,
          maxSelect: 1,
          displayFields: ["name", "email"]
        }
      }
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_blog_posts_slug` ON `blog_posts` (`slug`)",
      "CREATE INDEX `idx_blog_posts_status` ON `blog_posts` (`status`)",
      "CREATE INDEX `idx_blog_posts_published_at` ON `blog_posts` (`published_at`)"
    ],
    listRule: "status = 'published' || @request.auth.id = user",
    viewRule: "status = 'published' || @request.auth.id = user",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = user",
    deleteRule: "@request.auth.id = user"
  });

  return Dao(db).saveCollection(blogPosts);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("blog_posts");
  return dao.deleteCollection(collection);
});

migrate((db) => {
  // ============================================
  // Contact Messages Collection
  // ============================================
  const contactMessages = new Collection({
    id: "contact_messages",
    name: "contact_messages",
    type: "base",
    schema: [
      {
        id: "name_field",
        name: "name",
        type: "text",
        required: true,
        options: { min: 1, max: 100 }
      },
      {
        id: "email_field",
        name: "email",
        type: "email",
        required: true
      },
      {
        id: "subject_field",
        name: "subject",
        type: "text",
        required: true,
        options: { min: 1, max: 200 }
      },
      {
        id: "message_field",
        name: "message",
        type: "text",
        required: true,
        options: { min: 1, max: 5000 }
      },
      {
        id: "status_field",
        name: "status",
        type: "select",
        required: true,
        options: { maxSelect: 1, values: ["new", "read", "replied"] }
      }
    ],
    indexes: [
      "CREATE INDEX `idx_contact_messages_status` ON `contact_messages` (`status`)",
      "CREATE INDEX `idx_contact_messages_created` ON `contact_messages` (`created`)"
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''"
  });

  return Dao(db).saveCollection(contactMessages);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("contact_messages");
  return dao.deleteCollection(collection);
});

migrate((db) => {
  // ============================================
  // App Settings Collection
  // ============================================
  const appSettings = new Collection({
    id: "app_settings",
    name: "app_settings",
    type: "base",
    schema: [
      {
        id: "user_field",
        name: "user",
        type: "relation",
        required: true,
        options: {
          collectionId: "users",
          cascadeDelete: true,
          maxSelect: 1,
          displayFields: ["name", "email"]
        }
      },
      {
        id: "app_id_field",
        name: "app_id",
        type: "text",
        required: true,
        options: { min: 1, max: 100, pattern: "^[a-z0-9\\-\\.]+$" }
      },
      {
        id: "settings_field",
        name: "settings",
        type: "json",
        required: true
      }
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_app_settings_user_app` ON `app_settings` (`user`, `app_id`)"
    ],
    listRule: "@request.auth.id = user",
    viewRule: "@request.auth.id = user",
    createRule: "@request.auth.id != '' && @request.auth.id = user",
    updateRule: "@request.auth.id = user",
    deleteRule: "@request.auth.id = user"
  });

  return Dao(db).saveCollection(appSettings);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("app_settings");
  return dao.deleteCollection(collection);
});

migrate((db) => {
  // ============================================
  // Files Metadata Collection (VFS Sync)
  // ============================================
  const filesMetadata = new Collection({
    id: "files_metadata",
    name: "files_metadata",
    type: "base",
    schema: [
      {
        id: "path_field",
        name: "path",
        type: "text",
        required: true,
        options: { min: 1, max: 1000 }
      },
      {
        id: "name_field",
        name: "name",
        type: "text",
        required: true,
        options: { min: 1, max: 255 }
      },
      {
        id: "mime_type_field",
        name: "mime_type",
        type: "text",
        required: false,
        options: { max: 100 }
      },
      {
        id: "size_field",
        name: "size",
        type: "number",
        required: false,
        options: { min: 0 }
      },
      {
        id: "user_field",
        name: "user",
        type: "relation",
        required: true,
        options: {
          collectionId: "users",
          cascadeDelete: true,
          maxSelect: 1,
          displayFields: ["name", "email"]
        }
      },
      {
        id: "synced_at_field",
        name: "synced_at",
        type: "date",
        required: false
      },
      {
        id: "checksum_field",
        name: "checksum",
        type: "text",
        required: false,
        options: { max: 64 }
      },
      {
        id: "is_directory_field",
        name: "is_directory",
        type: "bool",
        required: false
      },
      {
        id: "parent_path_field",
        name: "parent_path",
        type: "text",
        required: false,
        options: { max: 1000 }
      }
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_files_metadata_user_path` ON `files_metadata` (`user`, `path`)",
      "CREATE INDEX `idx_files_metadata_parent_path` ON `files_metadata` (`user`, `parent_path`)",
      "CREATE INDEX `idx_files_metadata_synced_at` ON `files_metadata` (`synced_at`)"
    ],
    listRule: "@request.auth.id = user",
    viewRule: "@request.auth.id = user",
    createRule: "@request.auth.id != '' && @request.auth.id = user",
    updateRule: "@request.auth.id = user",
    deleteRule: "@request.auth.id = user"
  });

  return Dao(db).saveCollection(filesMetadata);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("files_metadata");
  return dao.deleteCollection(collection);
});
