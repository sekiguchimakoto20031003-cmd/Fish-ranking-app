-- Insert test users
INSERT OR IGNORE INTO users (username, display_name, bio, avatar_url) VALUES 
  ('taro_angler', '釣り太郎', '週末アングラー。バス釣りが好きです。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=taro'),
  ('sakura_fisher', 'さくら', '海釣り大好き！アジング専門です。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sakura'),
  ('yamada_pro', '山田プロ', 'トーナメンター。主にシーバスを狙っています。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=yamada');

-- Insert fish species
INSERT OR IGNORE INTO fish_species (name_ja, name_en, scientific_name, category) VALUES 
  ('ブラックバス', 'Black Bass', 'Micropterus salmoides', '淡水魚'),
  ('アジ', 'Horse Mackerel', 'Trachurus japonicus', '海水魚'),
  ('シーバス', 'Japanese Sea Bass', 'Lateolabrax japonicus', '海水魚'),
  ('ニジマス', 'Rainbow Trout', 'Oncorhynchus mykiss', '淡水魚'),
  ('マダイ', 'Red Sea Bream', 'Pagrus major', '海水魚'),
  ('アユ', 'Ayu', 'Plecoglossus altivelis', '淡水魚'),
  ('イワナ', 'Char', 'Salvelinus leucomaenis', '淡水魚'),
  ('メバル', 'Rockfish', 'Sebastes inermis', '海水魚');

-- Insert test posts
INSERT OR IGNORE INTO posts (user_id, content, location_name, latitude, longitude, caught_at, weather, tide) VALUES 
  (1, '今日は良型のバスが釣れました！朝マズメが最高でした。', '琵琶湖', 35.2404, 136.0986, datetime('now', '-1 hours'), '晴れ', NULL),
  (2, 'アジング楽しい！20cmオーバー連発！', '横浜港', 35.4437, 139.6380, datetime('now', '-2 hours'), '曇り', '満潮'),
  (3, 'シーバス70cmゲット！ルアーはVJで。', '東京湾', 35.5440, 139.7765, datetime('now', '-3 hours'), '晴れ', '下げ潮'),
  (1, '小バス祭りでした〜数釣り楽しい', '野池', 34.6851, 135.5136, datetime('now', '-1 days'), '曇り', NULL);

-- Insert fish catches
INSERT OR IGNORE INTO fish_catches (post_id, species_id, species_name, size_cm, weight_kg, tackle, bait) VALUES 
  (1, 1, 'ブラックバス', 45.5, 1.8, 'ベイトタックル', 'スピナーベイト'),
  (2, 2, 'アジ', 22.0, 0.15, 'アジングロッド', 'ワーム'),
  (2, 2, 'アジ', 20.5, 0.12, 'アジングロッド', 'ワーム'),
  (3, 3, 'シーバス', 70.0, 3.2, 'シーバスロッド', 'VJ-16'),
  (4, 1, 'ブラックバス', 30.0, 0.5, 'スピニングタックル', 'ネコリグ');

-- Insert media
INSERT OR IGNORE INTO media (post_id, media_type, url, thumbnail_url, order_index) VALUES 
  (1, 'image', 'https://picsum.photos/800/600?random=1', 'https://picsum.photos/200/150?random=1', 0),
  (2, 'image', 'https://picsum.photos/800/600?random=2', 'https://picsum.photos/200/150?random=2', 0),
  (3, 'image', 'https://picsum.photos/800/600?random=3', 'https://picsum.photos/200/150?random=3', 0),
  (4, 'image', 'https://picsum.photos/800/600?random=4', 'https://picsum.photos/200/150?random=4', 0);

-- Insert comments
INSERT OR IGNORE INTO comments (post_id, user_id, parent_comment_id, content) VALUES 
  (1, 2, NULL, 'ナイスバス！サイズいいですね〜'),
  (1, 3, NULL, 'スピナベの色は何使ってますか？'),
  (1, 1, 2, 'チャートホワイトです！朝は白系がいいですよ'),
  (2, 1, NULL, 'アジング楽しそう！今度教えてください'),
  (3, 2, NULL, '70はデカい！！');

-- Insert likes
INSERT OR IGNORE INTO likes (post_id, user_id) VALUES 
  (1, 2),
  (1, 3),
  (2, 1),
  (2, 3),
  (3, 1),
  (3, 2);

-- Insert sample rankings
INSERT OR IGNORE INTO rankings (species_id, category, period, post_id, user_id, value, rank) VALUES 
  (1, 'size', '2024-01', 1, 1, 45.5, 1),
  (1, 'weight', '2024-01', 1, 1, 1.8, 1),
  (3, 'size', '2024-01', 3, 3, 70.0, 1),
  (2, 'size', '2024-01', 2, 2, 22.0, 1);