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
- Playwright (E2E)

## ローカル起動

1. 依存関係をインストール

```bash
npm install
```

2. 環境変数を設定  
`.env.example` をコピーして `.env.local` を作成し、値を入れてください。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

3. Supabase スキーマを適用
- Supabase プロジェクトを作成
- SQL Editor で `supabase/schema.sql` を実行
- 既存環境を更新する場合は `supabase/migrations/20260220_series_type_link.sql` も実行
- さらに感想3分割を使う場合は `supabase/migrations/20260221_split_review_fields.sql` も実行

4. 開発サーバー起動

```bash
npm run dev
```

## Vercel デプロイ

1. GitHub に push
2. Vercel でプロジェクトを Import
3. Vercel の Environment Variables に以下を設定
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## OAuth 設定

### Supabase 側
- `Authentication > URL Configuration`
- `Site URL`: `https://<your-vercel-domain>`
- `Redirect URLs`:
  - `http://localhost:3000/auth/callback`
  - `https://<your-vercel-domain>/auth/callback`

### Google Cloud 側
- `承認済みのリダイレクト URI` に以下を設定
  - `https://<your-project-ref>.supabase.co/auth/v1/callback`

## 品質チェック

```bash
npm run lint
npm run build
```

## E2E テスト

```bash
npm run e2e
```

`PLAYWRIGHT_BASE_URL` を指定すると対象URLを変更できます。未指定時は `http://127.0.0.1:3000` を使用します。

## 実装済みページ

- `/` 優先リスト（D&D並び替え、シリーズ表示）
- `/add` 新規登録
- `/library` 一覧・検索・編集
- `/manage` 完了管理
- `/login` Google ログイン
