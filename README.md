# Flowlog (MVP)

映画・アニメ・ゲーム・漫画などの「これから見る/やる予定」を管理する個人向けアプリです。  
Next.js App Router + TypeScript + Tailwind + Supabase(Auth/Postgres) 構成で、Vercel デプロイを前提にしています。

## 技術スタック

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres)
- dnd-kit
- framer-motion

## ローカル起動

1. 依存関係インストール

```bash
npm install
```

2. 環境変数を設定

`.env.example` をコピーして `.env.local` を作成し、値を入れてください。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

3. Supabase のスキーマを適用

- Supabase プロジェクト作成
- SQL Editor で `supabase/schema.sql` を実行

4. 開発サーバー起動

```bash
npm run dev
```

## Vercel デプロイ手順

1. このリポジトリを GitHub に push
2. Vercel でプロジェクトを Import
3. Vercel の Environment Variables に以下を設定
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy 実行

## Google OAuth 設定

Supabase Auth > Providers > Google を有効化し、Redirect URL を設定:

- `http://localhost:3000/auth/callback`
- `https://<your-vercel-domain>/auth/callback`

## 実装済みページ

- `/` 優先リスト（D&D並び替え、シリーズ単位表示）
- `/add` 新規登録
- `/library` 一覧・検索・編集
- `/manage` 完了管理
- `/login` Google ログイン

## 補足

- `next.config.ts` で `images.remotePatterns` は全ホストを許可しています。
- ビルド時の ESLint 実行は一時的に無効化（`ignoreDuringBuilds: true`）しています。
  - 型チェックは `next build` で継続されます。
