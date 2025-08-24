# FishSNS - リアルタイム釣果共有SNS 🎣

## Project Overview
- **Name**: FishSNS
- **Goal**: 釣り愛好家がリアルタイムで釣果を共有し、交流できるSNSプラットフォーム
- **Features**: 
  - リアルタイム釣果投稿
  - 位置情報・天候・潮汐情報の記録
  - 魚種別ランキングシステム
  - いいね・コメント・リポスト機能
  - スレッド形式のコメント返信
  - ユーザープロファイル管理

## URLs
- **Development**: https://3000-ikpgem3ofn50t4b4yi9s5-6532622b.e2b.dev
- **Production**: (デプロイ後に更新)
- **GitHub**: https://github.com/sekiguchimakoto20031003-cmd/Fish-ranking-app

## Currently Completed Features ✅
1. **データベース設計と実装**
   - ユーザー、投稿、釣果、メディア、コメント、いいね、ランキングテーブル
   - インデックス最適化済み
   - テストデータ投入済み

2. **バックエンドAPI**
   - ユーザー登録・プロファイル取得
   - 投稿の作成・取得・削除
   - いいね機能
   - コメント機能
   - ランキング取得
   - 魚種マスターデータ管理

3. **フロントエンドUI**
   - レスポンシブデザイン
   - タイムライン表示
   - 投稿作成フォーム
   - ユーザー認証（ローカルストレージベース）
   - いいね機能
   - リアルタイム更新（30秒ポーリング）
   - 無限スクロール

## API Endpoints 📡

### User Endpoints
- `GET /api/users/:username` - ユーザープロファイル取得
- `POST /api/users` - ユーザー作成

### Post Endpoints
- `GET /api/posts?page=1&limit=20` - 投稿一覧取得（ページネーション対応）
- `POST /api/posts` - 新規投稿作成
- `DELETE /api/posts/:id` - 投稿削除

### Interaction Endpoints
- `POST /api/posts/:id/like` - いいね追加
- `DELETE /api/posts/:id/like` - いいね削除
- `POST /api/posts/:id/comments` - コメント追加
- `GET /api/posts/:id/comments` - コメント一覧取得

### Other Endpoints
- `GET /api/rankings?species_id=&category=size&period=all_time` - ランキング取得
- `GET /api/species` - 魚種一覧取得

## Features Not Yet Implemented 🚧
1. **画像・動画アップロード機能**
   - Cloudflare R2との連携が必要
   
2. **コメント表示モーダル**
   - スレッド形式の表示UI
   
3. **ランキング画面**
   - 魚種別・期間別の詳細表示
   
4. **位置情報による近くの釣果表示**
   - GPSデータの活用
   
5. **リポスト機能**
   - 引用投稿の実装
   
6. **ユーザー認証の改善**
   - JWT認証の実装
   
7. **プッシュ通知**
   - WebSocket/SSEの実装

## Recommended Next Steps 🚀
1. **Cloudflare R2セットアップ**
   - 画像・動画アップロード機能の実装
   
2. **認証システムの強化**
   - JWT認証の実装
   - セッション管理
   
3. **リアルタイム通信**
   - WebSocketまたはSSEの実装
   - 即座の更新通知
   
4. **UI/UXの改善**
   - コメントモーダルの実装
   - ランキング画面の作成
   - エラーハンドリングの強化
   
5. **本番環境へのデプロイ**
   - Cloudflare Pagesへのデプロイ
   - カスタムドメインの設定

## Data Architecture 🗄️
- **Data Models**: 
  - Users (ユーザー情報)
  - Posts (投稿)
  - Fish Catches (釣果詳細)
  - Media (写真・動画)
  - Comments (コメント)
  - Likes (いいね)
  - Reposts (リポスト)
  - Rankings (ランキング)
  - Fish Species (魚種マスター)
  
- **Storage Services**: 
  - Cloudflare D1 (SQLiteベースのデータベース)
  - 今後: Cloudflare R2 (画像・動画ストレージ)
  
- **Data Flow**: 
  - フロントエンド → Hono API → D1 Database
  - リアルタイム更新: 30秒間隔のポーリング

## User Guide 📱

### 初めての利用
1. サイトにアクセス
2. 右上の「ログイン」ボタンをクリック
3. ユーザー名と表示名を入力して登録

### 釣果を投稿する
1. ログイン後、ヘッダーの「投稿」ボタンをクリック
2. 釣果情報を入力:
   - コメント（任意）
   - 釣り場所
   - 釣った時間
   - 天気・潮汐情報
   - 魚の詳細（種類、サイズ、重さ、タックル、餌）
3. 「投稿する」ボタンで共有

### タイムラインの閲覧
- 最新の釣果が自動的に表示
- いいねボタンで反応
- コメントで交流
- 下にスクロールで過去の投稿を読み込み

## Deployment 🌐
- **Platform**: Cloudflare Pages
- **Status**: ⚠️ Development
- **Tech Stack**: 
  - Hono (軽量Webフレームワーク)
  - TypeScript
  - Cloudflare D1 (データベース)
  - TailwindCSS (スタイリング)
  - Vanilla JavaScript (フロントエンド)
- **Last Updated**: 2025-01-24

## Development Commands 🛠️

```bash
# ローカル開発環境の起動
npm run dev:sandbox

# ビルド
npm run build

# データベースマイグレーション（ローカル）
npm run db:migrate:local

# データベースリセット＆シード投入
npm run db:reset

# デプロイ（要Cloudflare認証）
npm run deploy
```

## Project Structure 📁
```
webapp/
├── src/
│   └── index.tsx      # Hono APIサーバー
├── public/
│   └── static/
│       ├── app.js     # フロントエンドアプリケーション
│       └── styles.css # カスタムスタイル
├── migrations/        # データベースマイグレーション
├── seed.sql          # テストデータ
├── ecosystem.config.cjs # PM2設定
├── wrangler.jsonc    # Cloudflare設定
└── package.json      # 依存関係とスクリプト
```

## Contributing 🤝
このプロジェクトは現在開発中です。機能追加や改善のアイデアがあれば、ぜひご提案ください！

---

Built with ❤️ for anglers by FishSNS Developer