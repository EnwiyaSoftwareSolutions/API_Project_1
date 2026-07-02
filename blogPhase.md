# structure of the blog 

```sql
-- Authors (maps to attorney profiles, admin users, etc.)
CREATE TABLE authors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  bio         TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Categories (e.g. "Corporate Law", "Estate Planning", "Immigration")
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

-- Blog posts
CREATE TABLE posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(255) NOT NULL,
  slug            VARCHAR(255) UNIQUE NOT NULL,
  excerpt         TEXT,                          -- short summary for cards/SEO
  content         TEXT NOT NULL,                 -- rich text HTML from Quill
  cover_image_url TEXT,
  author_id       UUID REFERENCES authors(id) ON DELETE SET NULL,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  status          VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Tags (many-to-many with posts)
CREATE TABLE tags (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  VARCHAR(60) NOT NULL,
  slug  VARCHAR(60) UNIQUE NOT NULL
);

CREATE TABLE post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Index for fast slug lookups and feed queries
CREATE INDEX idx_posts_slug        ON posts(slug);
CREATE INDEX idx_posts_status_date ON posts(status, published_at DESC);
CREATE INDEX idx_posts_category    ON posts(category_id);
```