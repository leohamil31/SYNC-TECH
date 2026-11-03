# Entity Relationship Diagram (DER)

```mermaid
erDiagram
    USERS ||--o{ COURSES : "creates"
    USERS ||--o{ MODULES : "creates"
    COURSES ||--|{ MODULES : "has"
    MODULES ||--|{ CONTENTS : "has"
    USERS ||--o{ CONTENT_VIEWS : "has progress in"
    CONTENTS ||--o{ CONTENT_VIEWS : "is watched in"

    USERS {
        int id PK
        varchar name
        varchar email UK
        user_status status "active | inactive"
        varchar password_hash "scrypt, never returned by the API"
        user_role role "student | admin"
        timestamptz last_login_at
        timestamptz created_at
        timestamptz updated_at
    }
    COURSES {
        int id PK
        varchar code UK
        varchar title
        text description
        int user_id FK "author"
        boolean published "hidden from students when false"
        timestamptz created_at
        timestamptz updated_at
    }
    MODULES {
        int id PK
        int course_id FK
        int user_id FK "author"
        varchar title
        text description
        timestamptz created_at
        timestamptz updated_at
    }
    CONTENTS {
        int id PK
        int module_id FK
        varchar title
        text content "lesson summary"
        varchar video_url "canonical YouTube watch URL"
        int duration_seconds "nullable, > 0"
        int position "order inside the module"
        timestamptz created_at
        timestamptz updated_at
    }
    CONTENT_VIEWS {
        int id PK
        int user_id FK
        int content_id FK
        timestamptz watched_at "first access"
        int position_seconds "resume point, >= 0"
        timestamptz completed_at "null while in progress"
        timestamptz created_at
        timestamptz updated_at
    }
```

## Design decisions

| Decision | Reason |
| --- | --- |
| `courses.user_id` and `modules.user_id` reference `users` with `ON DELETE RESTRICT` | Required by the test (who inserted the record). A user who authored content cannot be deleted silently; the API returns `409`. |
| `modules.course_id` and `contents.module_id` use `ON DELETE CASCADE` | Modules and contents do not exist without their parent. |
| `courses.code` and `users.email` are `UNIQUE` | Business keys. Codes are stored uppercase and emails lowercase by the API. |
| `user_status` is a native PostgreSQL enum | The database guarantees only valid statuses. |
| Watch tracking uses a new N:N table `content_views` | A content is watched by many users and a user watches many contents. Columns on `users` or `contents` could not represent this without arrays or duplication. `UNIQUE (user_id, content_id)` prevents duplicates and `watched_at` keeps when it happened, which also allows progress reports later. |
| Indexes on every foreign key | PostgreSQL does not create them automatically; they speed up joins and cascades. |
| "1 or more modules/contents" is enforced by the application flow, not by the schema | A hard constraint would make it impossible to create a course before its first module. |
| `content_views` doubles as per-lesson progress (`position_seconds`, `completed_at`) | One row per learner and lesson already exists, so progress is two columns, not a new table. A row is created when the lesson starts; `completed_at` marks completion. Reports count only completed rows. Rows from before the migration are backfilled as completed. |
| `users.role` is a native enum, checked on every request | Role and status are re-read from the database for each authenticated request, so demoting or deactivating an account takes effect immediately, not when the token expires. |
| Passwords hashed with scrypt (`node:crypto`), parameters stored with the hash | No native dependency, and the cost can be raised later without invalidating existing hashes. |
