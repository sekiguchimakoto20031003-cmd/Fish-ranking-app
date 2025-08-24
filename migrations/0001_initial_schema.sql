-- Users table - プロフィール管理
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fish species table - 魚種マスターデータ
CREATE TABLE IF NOT EXISTS fish_species (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ja TEXT NOT NULL,
  name_en TEXT,
  scientific_name TEXT,
  category TEXT, -- 海水魚、淡水魚、汽水魚など
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Posts table - 釣果投稿
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content TEXT,
  location_name TEXT,
  latitude REAL,
  longitude REAL,
  caught_at DATETIME,
  weather TEXT,
  tide TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Fish catches table - 釣果詳細
CREATE TABLE IF NOT EXISTS fish_catches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  species_id INTEGER,
  species_name TEXT NOT NULL, -- 手入力の魚種名
  size_cm REAL,
  weight_kg REAL,
  tackle TEXT, -- 使用したタックル
  bait TEXT, -- 餌・ルアー
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (species_id) REFERENCES fish_species(id)
);

-- Media table - 写真・動画
CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK(media_type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Comments table - スレッド形式のコメント
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  parent_comment_id INTEGER, -- 返信の親コメント
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Likes table - いいね機能
CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);

-- Reposts table - リポスト機能
CREATE TABLE IF NOT EXISTS reposts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  comment TEXT, -- リポスト時のコメント
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);

-- Rankings table - ランキングキャッシュ
CREATE TABLE IF NOT EXISTS rankings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  species_id INTEGER,
  category TEXT NOT NULL, -- 'size', 'weight', 'monthly', etc.
  period TEXT, -- '2024-01', 'all_time', etc.
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  value REAL NOT NULL, -- サイズや重さの値
  rank INTEGER NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (species_id) REFERENCES fish_species(id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fish_catches_post_id ON fish_catches(post_id);
CREATE INDEX IF NOT EXISTS idx_fish_catches_species_id ON fish_catches(species_id);
CREATE INDEX IF NOT EXISTS idx_media_post_id ON media(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_reposts_post_id ON reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_reposts_user_id ON reposts(user_id);
CREATE INDEX IF NOT EXISTS idx_rankings_species_category ON rankings(species_id, category, period);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);