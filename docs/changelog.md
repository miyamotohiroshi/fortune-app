# Changelog

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
