# Changelog

## 2026-04-12 元命セクション表示されない不具合の修正

### 修正ファイル
- `src/app/result/page.tsx` — 既存ユーザーの `genmeiId` が NULL の場合に誕生日から計算するフォールバックを追加

### フロー・補足
- 既存ユーザー（機能追加前に登録済み）は DB の `genmeiId` が NULL のため元命セクションが表示されなかった
- `user.genmeiId ?? calculateGenmeiId(birthday)` で DB 未登録でも誕生日から自動算出するよう修正
- 原因調査中に dev サーバーが2重起動していたことも判明（ポート3000の旧プロセスが残存し変更未反映だった）

## 2026-04-12 元命（月柱の地支通変星）の追加・結果ページ構成変更

### 新規ファイル
- `src/app/result/page.tsx` — `/result` に占断結果ページを新規作成（日柱・元命の2セクション構成）

### 修正ファイル
- `prisma/schema.prisma` — `GenmeiData` モデルと `User.genmeiId` フィールドを追加
- `prisma/seed.ts` — 元命データ（比肩〜印綬）の初期データ10件を追加
- `src/lib/zodiacCalc.ts` — `calculateGenmeiId()` 関数を追加（月柱の地支通変星を算出）
- `src/app/actions/auth.ts` — 登録時に `genmeiId` を計算・保存、リダイレクト先を `/result` に変更
- `src/proxy.ts` — マッチャーに `/result` を追加
- `src/app/result/[id]/page.tsx` — 削除（`/result` に統合）

### フロー・補足
- `/result/[id]` を廃止し `/result` に一本化。ユーザー情報はセッションのDBから取得するため URL にIDは不要
- 結果ページは「日柱（indigo）」と「元命（violet）」の2セクション構成
- 元命データのtitle・descriptionは仮データ。後で正式データに差し替え予定
- `npx prisma db push` でDBに `GenmeiData` テーブルを作成済み

## 2026-04-04 会員登録・ログイン・認証機能の追加

### 新規ファイル
- `src/lib/session.ts` — JWTセッション管理（jose使用、7日間有効）
- `src/app/actions/auth.ts` — `signup` / `login` / `logout` Server Actions
- `src/app/login/page.tsx` — ログインページ
- `src/proxy.ts` — `/result/*` を認証保護（Next.js 16の新規約 `proxy.ts`）

### 修正ファイル
- `src/app/page.tsx` — メールアドレス・パスワード欄を追加、[登録して占う] ボタンでDB登録＆セッション作成
- `src/app/result/[id]/page.tsx` — セッションチェック→未ログインは `/login` へリダイレクト、DBからニックネームを取得

### フロー・補足
- TOP画面で名前・生年月日・メール・パスワードを入力 → [登録して占う] → DBに会員登録 → セッションCookie発行 → 結果ページへ
- 既存会員は `/login` からログイン → 自分の結果ページへ
- 未ログインで `/result/*` にアクセス → `/login` にリダイレクト
- 結果ページにログアウトボタンを追加
- パスワードは bcryptjs でハッシュ化して保存
- `jose` / `bcryptjs` パッケージを追加
- `.env.local` に `SESSION_SECRET` を追加
