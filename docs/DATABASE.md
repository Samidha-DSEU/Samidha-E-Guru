# DATABASE.md — PostgreSQL Database Schema & Entity Relationships

> **Database engine**: PostgreSQL 16 (UUID primary keys, foreign key constraints, indexes, timestamps).  
> **Rule**: Resource hierarchy is strictly `Class -> Subject -> Chapter -> Resource`. Institution Type is strictly part of `learner_profiles`.

---

## 1. AUTHENTICATION MODULE

### `roles`
- `id`: UUID (PK, default `gen_random_uuid()`)
- `name`: VARCHAR(50) UNIQUE NOT NULL (`student`, `volunteer`, `alumni`, `admin`, `super_admin`)
- `description`: TEXT
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### `users`
- `id`: UUID (PK)
- `email`: VARCHAR(255) UNIQUE NOT NULL
- `google_id`: VARCHAR(255) UNIQUE NULL
- `role_id`: UUID (FK -> `roles.id`) NOT NULL
- `is_active`: BOOLEAN DEFAULT TRUE
- `is_verified`: BOOLEAN DEFAULT FALSE
- `last_login_at`: TIMESTAMP WITH TIME ZONE NULL
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `updated_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### `profiles`
- `id`: UUID (PK)
- `user_id`: UUID (FK -> `users.id` ON DELETE CASCADE) UNIQUE NOT NULL
- `full_name`: VARCHAR(255) NOT NULL
- `avatar_url`: TEXT NULL
- `bio`: TEXT NULL
- `phone`: VARCHAR(20) NULL
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `updated_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### `learner_profiles`
- `id`: UUID (PK)
- `user_id`: UUID (FK -> `users.id` ON DELETE CASCADE) UNIQUE NOT NULL
- `institution_type`: VARCHAR(100) NULL (`School`, `College`, `Other`)
- `institution_name`: VARCHAR(255) NULL
- `class_or_degree`: VARCHAR(100) NULL
- `interests`: TEXT[] NULL
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### `volunteer_profiles`
- `id`: UUID (PK)
- `user_id`: UUID (FK -> `users.id` ON DELETE CASCADE) UNIQUE NOT NULL
- `organization`: VARCHAR(255) NULL
- `expertise_areas`: TEXT[] NULL
- `volunteer_hours`: INT DEFAULT 0
- `is_approved`: BOOLEAN DEFAULT FALSE
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### `alumni_profiles`
- `id`: UUID (PK)
- `user_id`: UUID (FK -> `users.id` ON DELETE CASCADE) UNIQUE NOT NULL
- `graduation_year`: INT NULL
- `current_company`: VARCHAR(255) NULL
- `designation`: VARCHAR(255) NULL
- `mentorship_offered`: BOOLEAN DEFAULT TRUE
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### `user_sessions`
- `id`: UUID (PK)
- `user_id`: UUID (FK -> `users.id` ON DELETE CASCADE) NOT NULL
- `refresh_token_hash`: VARCHAR(255) NOT NULL
- `user_agent`: TEXT NULL
- `ip_address`: VARCHAR(45) NULL
- `expires_at`: TIMESTAMP WITH TIME ZONE NOT NULL
- `is_revoked`: BOOLEAN DEFAULT FALSE
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

---

## 2. EDUCATION MODULE

### `classes`
- `id`: UUID (PK)
- `name`: VARCHAR(100) NOT NULL (`Class 9`, `Class 10`, `Class 11`, `Class 12`, `B.Tech`, etc.)
- `code`: VARCHAR(50) UNIQUE NOT NULL
- `display_order`: INT DEFAULT 0
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### `subjects`
- `id`: UUID (PK)
- `class_id`: UUID (FK -> `classes.id` ON DELETE CASCADE) NOT NULL
- `name`: VARCHAR(150) NOT NULL (`Mathematics`, `Science`, `Physics`, `Chemistry`, etc.)
- `code`: VARCHAR(50) NOT NULL
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### `chapters`
- `id`: UUID (PK)
- `subject_id`: UUID (FK -> `subjects.id` ON DELETE CASCADE) NOT NULL
- `name`: VARCHAR(255) NOT NULL
- `chapter_number`: INT NOT NULL
- `description`: TEXT NULL
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

---

## 3. RESOURCES MODULE

### `resource_types`
- `id`: UUID (PK)
- `name`: VARCHAR(100) UNIQUE NOT NULL (`Book`, `Notes`, `Solutions`, `Question Bank`, `Sample Paper`, `PYQ`, `Video`, `Article`, `PDF`, `Worksheet`)
- `slug`: VARCHAR(100) UNIQUE NOT NULL

### `resource_sources`
- `id`: UUID (PK)
- `name`: VARCHAR(100) UNIQUE NOT NULL (`NCERT`, `DIKSHA`, `NPTEL`, `SWAYAM`, `YouTube`, `SAMIDHA`, `Other`)
- `url`: TEXT NULL

### `resources`
- `id`: UUID (PK)
- `title`: VARCHAR(255) NOT NULL
- `description`: TEXT NULL
- `thumbnail_url`: TEXT NULL
- `external_url`: TEXT NOT NULL
- `chapter_id`: UUID (FK -> `chapters.id` ON DELETE CASCADE) NOT NULL
- `resource_type_id`: UUID (FK -> `resource_types.id`) NOT NULL
- `resource_source_id`: UUID (FK -> `resource_sources.id`) NOT NULL
- `uploader_id`: UUID (FK -> `users.id` ON DELETE SET NULL) NULL
- `verification_status`: VARCHAR(50) DEFAULT 'pending' (`pending`, `approved`, `rejected`)
- `rejection_reason`: TEXT NULL
- `views_count`: INT DEFAULT 0
- `bookmarks_count`: INT DEFAULT 0
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `updated_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### `resource_files`
- `id`: UUID (PK)
- `resource_id`: UUID (FK -> `resources.id` ON DELETE CASCADE) NOT NULL
- `file_url`: TEXT NOT NULL
- `file_name`: VARCHAR(255) NOT NULL
- `file_size`: BIGINT NULL
- `file_type`: VARCHAR(50) NULL
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### `bookmarks`
- `id`: UUID (PK)
- `user_id`: UUID (FK -> `users.id` ON DELETE CASCADE) NOT NULL
- `resource_id`: UUID (FK -> `resources.id` ON DELETE CASCADE) NOT NULL
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- UNIQUE constraint (`user_id`, `resource_id`)

### `learning_progress`
- `id`: UUID (PK)
- `user_id`: UUID (FK -> `users.id` ON DELETE CASCADE) NOT NULL
- `chapter_id`: UUID (FK -> `chapters.id` ON DELETE CASCADE) NOT NULL
- `completed_resources_count`: INT DEFAULT 0
- `total_resources_count`: INT DEFAULT 0
- `progress_percentage`: FLOAT DEFAULT 0.0
- `is_completed`: BOOLEAN DEFAULT FALSE
- `updated_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- UNIQUE constraint (`user_id`, `chapter_id`)

### `resource_views`
- `id`: UUID (PK)
- `resource_id`: UUID (FK -> `resources.id` ON DELETE CASCADE) NOT NULL
- `user_id`: UUID (FK -> `users.id` ON DELETE SET NULL) NULL
- `ip_address`: VARCHAR(45) NULL
- `viewed_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### `resource_reports`
- `id`: UUID (PK)
- `resource_id`: UUID (FK -> `resources.id` ON DELETE CASCADE) NOT NULL
- `reporter_id`: UUID (FK -> `users.id` ON DELETE CASCADE) NOT NULL
- `reason`: VARCHAR(100) NOT NULL (`Broken Link`, `Copyright Issue`, `Incorrect Content`, `Spam`, `Other`)
- `details`: TEXT NULL
- `status`: VARCHAR(50) DEFAULT 'open' (`open`, `resolved`, `dismissed`)
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

---

## 4. COMMUNITY MODULE

### `posts`
- `id`: UUID (PK)
- `author_id`: UUID (FK -> `users.id` ON DELETE CASCADE) NOT NULL
- `title`: VARCHAR(255) NOT NULL
- `content`: TEXT NOT NULL
- `post_type`: VARCHAR(50) DEFAULT 'general' (`general`, `mentorship`, `career_guidance`, `article`)
- `likes_count`: INT DEFAULT 0
- `comments_count`: INT DEFAULT 0
- `is_public`: BOOLEAN DEFAULT TRUE
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `updated_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### `post_images`
- `id`: UUID (PK)
- `post_id`: UUID (FK -> `posts.id` ON DELETE CASCADE) NOT NULL
- `image_url`: TEXT NOT NULL
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### `comments`
- `id`: UUID (PK)
- `post_id`: UUID (FK -> `posts.id` ON DELETE CASCADE) NOT NULL
- `author_id`: UUID (FK -> `users.id` ON DELETE CASCADE) NOT NULL
- `parent_comment_id`: UUID (FK -> `comments.id` ON DELETE CASCADE) NULL
- `content`: TEXT NOT NULL
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### `likes`
- `id`: UUID (PK)
- `post_id`: UUID (FK -> `posts.id` ON DELETE CASCADE) NOT NULL
- `user_id`: UUID (FK -> `users.id` ON DELETE CASCADE) NOT NULL
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- UNIQUE constraint (`post_id`, `user_id`)

---

## 5. EVENTS MODULE

### `events`
- `id`: UUID (PK)
- `organizer_id`: UUID (FK -> `users.id` ON DELETE CASCADE) NOT NULL
- `title`: VARCHAR(255) NOT NULL
- `description`: TEXT NOT NULL
- `poster_url`: TEXT NULL
- `venue`: VARCHAR(255) NOT NULL (`Online`, `Google Meet`, or Physical address)
- `meeting_link`: TEXT NULL
- `event_date`: TIMESTAMP WITH TIME ZONE NOT NULL
- `max_participants`: INT NULL
- `registrations_count`: INT DEFAULT 0
- `is_cancelled`: BOOLEAN DEFAULT FALSE
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### `event_registrations`
- `id`: UUID (PK)
- `event_id`: UUID (FK -> `events.id` ON DELETE CASCADE) NOT NULL
- `user_id`: UUID (FK -> `users.id` ON DELETE CASCADE) NOT NULL
- `registered_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- UNIQUE constraint (`event_id`, `user_id`)

---

## 6. COMMUNICATION MODULE

### `announcements`
- `id`: UUID (PK)
- `creator_id`: UUID (FK -> `users.id` ON DELETE CASCADE) NOT NULL
- `title`: VARCHAR(255) NOT NULL
- `content`: TEXT NOT NULL
- `target_role`: VARCHAR(50) NULL (NULL means all users)
- `is_active`: BOOLEAN DEFAULT TRUE
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### `notifications`
- `id`: UUID (PK)
- `user_id`: UUID (FK -> `users.id` ON DELETE CASCADE) NOT NULL
- `title`: VARCHAR(255) NOT NULL
- `message`: TEXT NOT NULL
- `notification_type`: VARCHAR(50) NOT NULL (`system`, `announcement`, `resource`, `event`, `mentorship`)
- `is_read`: BOOLEAN DEFAULT FALSE
- `link`: TEXT NULL
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### `contact_messages`
- `id`: UUID (PK)
- `name`: VARCHAR(255) NOT NULL
- `email`: VARCHAR(255) NOT NULL
- `subject`: VARCHAR(255) NOT NULL
- `message`: TEXT NOT NULL
- `is_replied`: BOOLEAN DEFAULT FALSE
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

---

## 7. ADMINISTRATION & SCRAPER MODULE

### `scraper_sources`
- `id`: UUID (PK)
- `source_name`: VARCHAR(100) NOT NULL
- `base_url`: TEXT NOT NULL
- `is_active`: BOOLEAN DEFAULT TRUE
- `last_run_at`: TIMESTAMP WITH TIME ZONE NULL

### `scraper_jobs`
- `id`: UUID (PK)
- `source_id`: UUID (FK -> `scraper_sources.id`) NOT NULL
- `status`: VARCHAR(50) DEFAULT 'pending' (`pending`, `running`, `completed`, `failed`)
- `resources_found`: INT DEFAULT 0
- `resources_added`: INT DEFAULT 0
- `error_log`: TEXT NULL
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### `activity_logs`
- `id`: UUID (PK)
- `user_id`: UUID (FK -> `users.id` ON DELETE SET NULL) NULL
- `action`: VARCHAR(100) NOT NULL (`AUTH_LOGIN`, `RESOURCE_UPLOAD`, `RESOURCE_APPROVE`, `USER_BAN`, `REPORT_SUBMIT`, `SCRAPER_EXECUTE`)
- `details`: JSONB NULL
- `ip_address`: VARCHAR(45) NULL
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
