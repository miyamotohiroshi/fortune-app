# Changelog

## 2026-06-30 TOPページに生まれた時間・都市フィールドを追加

### 修正ファイル
- `src/app/page.tsx` — ClockIcon / MapPinIcon SVG追加、CITY_REGIONS定数（北海道〜海外）、birthTime・birthCityフィールドをSignupFormに追加（生年月日の直後に配置）
- `src/app/actions/auth.ts` — signup時に birthTime / birthCity を formData から取得してDB保存

### フロー・補足
- 都市はoptgroup形式でリージョン別に分類（北海道・東北・関東・中部・近畿・中国・四国・九州沖縄・海外）
- birthTime / birthCity は任意入力（未入力の場合はnullとして保存）
- DBスキーマの birthTime / birthCity フィールドはすでに存在していたため、スキーマ変更なし
- 西洋占星術の実際の計算は次フェーズで実装予定

## 2026-06-30 サインアップ500エラーの根本修正

### 修正ファイル
- `src/app/actions/auth.ts` — 診断コードを削除し、`isRedirectError`で`redirect()`を正しく再スロー。`try/catch`を外側1つに整理し、TypeScript TS18046エラー（`e.constructor.name`）を解消

### 環境変数
- Vercel本番環境に`SESSION_SECRET`を追加（jose JWT署名に必須）

### 削除ファイル
- `src/app/api/health/route.ts` — 診断用エンドポイント（不要になったため削除）

### フロー・補足
- **根本原因**: `SESSION_SECRET`がVercelに未設定 → `createSession()`内でjoseがHS256署名時に「キーが短すぎる」エラーをスロー → auth.tsにエラーハンドリングがなかったため500が返っていた
- **二次問題**: デバッグ過程で追加した`e.constructor.name`アクセスがTypeScript 5.9.3のTS18046エラーを引き起こし、複数コミットでVercelビルドが失敗し続けていた
- 修正後は`createSession`エラーや他の例外がフォームエラーとして表示され、`redirect()`は正常に動作する

## 2026-06-27 NeonサーバーレスHTTPドライバーへの切り替え（コールドスタート問題の根本解決）

### 新規依存パッケージ
- `@neondatabase/serverless` — HTTP経由でNeonに接続するドライバー
- `@prisma/adapter-neon` — PrismaとNeonドライバーをつなぐアダプター

### 修正ファイル
- `src/lib/prisma.ts` — `PrismaNeonHttp` アダプターを使用するよう変更。TCP接続からHTTP接続に切り替え

### フロー・補足
- Neon無料プランは5分無操作でDB自動停止 → 起動に5〜10秒かかる → Vercelの10秒タイムアウトを超えてエラー
- TCPではなくHTTPでDBと通信することでコールドスタートの遅延を回避
- `prisma/schema.prisma` の `driverAdapters` previewFeature は Prisma 6 でGA済みのため不要（追加せず）

## 2026-06-27 Vercel本番環境のDBエラー修正

### 修正ファイル
- `package.json` — ビルドスクリプトを `prisma generate && next build` に変更
- `src/lib/prisma.ts` — サーバーレス向け接続設定追加（`pgbouncer=true`・`connection_limit=1`）、本番でのクエリログ無効化

### 削除ファイル
- `src/app/api/debug/route.ts` — デバッグ用一時ファイル（DB操作API）
- `src/app/api/debug-action/route.ts` — デバッグ用スタブ（exportなしでビルドエラーの原因）
- `src/app/debug-action/actions.ts` / `page.tsx` — デバッグ用テストページ

### フロー・補足
- 久しぶりの起動後に会員登録フォームを送信すると「サーバーエラー」が発生していた
- 根本原因: Vercelがnodule_modulesをキャッシュする際、macOS用Prismaバイナリが残りLinux環境で動作しないケースがある
- `prisma generate` をビルドに組み込むことで毎回正しいバイナリが生成されるよう修正
- `pgbouncer=true` / `connection_limit=1` を追加しNeon PgBouncer接続を安定化

## 2026-04-24 tryページ・結果ページのデザイン変更・セクション再構成

### 新規ファイル
- `src/components/fortune/ShichusuimeiSection.tsx` — 日柱と通変星を1枚のカードにまとめた「四柱推命」セクション

### 修正ファイル
- `src/components/fortune/ZodiacSection.tsx` — ダークテーマ対応（サブセクション用に再設計）
- `src/components/fortune/GenmeiSection.tsx` — ダークテーマ対応（サブセクション用に再設計）
- `src/app/try/page.tsx` — ダークスペーステーマ適用（トップページと同系統デザイン）
- `src/app/result/page.tsx` — ダークテーマ + ShichusuimeiSection + 西洋占星術プレースホルダー追加
- `src/app/try/result/page.tsx` — ダークテーマ + ShichusuimeiSection + グラデーションボーダー会員登録ボタン

### フロー・補足
- 結果ページのセクション構成: 「四柱推命（日柱+通変星）」→「西洋占星術（近日公開）」の2セクション構成に変更
- ShichusuimeiSection はグラデーションボーダー（紫→インディゴ）の1枚カードで統一
- 将来の西洋占星術機能を "COMING SOON" プレースホルダーとして配置済み

## 2026-04-23 TOPページのデザイン全面リニューアル（ダークスペーステーマ）

### 修正ファイル
- `src/app/page.tsx` — ダークスペーステーマに全面リニューアル
- `src/app/actions/auth.ts` — パスワード最小文字数を6→8文字に修正（UIプレースホルダーとの整合）

### フロー・補足
- 背景: `#07071A` ダークネイビー + 紫/青のグローエフェクト + SVG 星・月・星座線
- フォームカード: グラスモーフィズム風（半透明ダーク背景 + border + backdrop-blur）
- 各入力フィールド: アイコン列（左）＋ ラベル＋input（右）の2カラム構成
- パスワード入力: 表示/非表示トグルボタン（目アイコン）を追加
- 「このアプリでできること」セクションをページ下部に追加（SVGアイコン4種）
- 「今後も新機能を続々追加予定！」フッターバナーを追加

## 2026-04-22 会員登録不要の試し占いページ追加・結果表示コンポーネント化

### 新規ファイル
- `src/components/fortune/ZodiacSection.tsx` — 日柱カードの共通コンポーネント
- `src/components/fortune/GenmeiSection.tsx` — 元命カードの共通コンポーネント
- `src/app/actions/fortune.ts` — 試し占い用 Server Action（`calculatePreview`）
- `src/app/try/page.tsx` — 登録不要の試し占いフォームページ（`/try`）
- `src/app/try/result/page.tsx` — 登録不要の結果表示ページ（`/try/result`）

### 修正ファイル
- `src/app/result/page.tsx` — 日柱・元命セクションを共通コンポーネントに置き換え

### フロー・補足
- `/try` → 名前・生年月日を入力 → Server Action が zodiacId・genmeiId を計算 → `/try/result?zodiacId=X&genmeiId=Y&nickname=Z` にリダイレクト
- `/try/result` は searchParams（URL クエリパラメータ）から ID を受け取り DB から説明文を取得して表示（認証不要）
- Next.js 16 では `searchParams` は `Promise` 型のため `await searchParams` で取得
- `/try` および `/try/result` は `proxy.ts` の matcher に含まれないため認証保護対象外
- `src/components/fortune/` を新設し、再利用可能な Server Component として配置

## 2026-04-22 Turbopackワークスペースルート誤検知・月支Decemberバグの修正

### 修正ファイル
- `next.config.ts` — `turbopack.root` を明示設定し、tailwindcss が解決できない問題を修正
- `src/lib/solarTerms.ts` — 12月大雪以降生まれで月支が亥月になるバグを修正（前年・当年両方の大雪JDをキャッシュ）

### フロー・補足
- `/Users/admin/package-lock.json` が存在するため Turbopack がルートを `/Users/admin` と誤認し、`tailwindcss` を解決できずに無限エラーループが発生していた。これがMacフリーズの原因
- `solarTerms.ts` のキャッシュ構造を `Map<branchIndex, jd>` から `{ jd, branchIndex }[]` の昇順配列に変更し、大雪は前年・当年の2件を含めるよう修正

## 2026-04-16 節入り日を天文計算で正確に算出するよう変更

### 新規ファイル
- `src/lib/solarTerms.ts` — Jean Meeus アルゴリズムによる太陽黄経計算・節入り JD 算出・月支インデックス取得

### 修正ファイル
- `src/lib/zodiacCalc.ts` — 近似日ハードコードの `getMonthBranchIndex` を削除し、`getMonthBranchBySetsuiri` に置き換え

### フロー・補足
- 従来は月・日の固定値（例: 8月7日以前→未月）で月支を判定していたため、年によって1〜2日ずれることがあった
- `solarTerms.ts` では Julian Day Number (JD) を使い、12 月節（小寒・立春・驚蟄…）の太陽黄経（285°・315°・345°…）を目標値としてニュートン法で収束させ、節入り瞬間を±1〜2 分精度で算出する
- 同じ年を複数回計算するケースに備え、年単位のメモリキャッシュを実装
- 元命（月柱の地支通変星）の計算精度が向上した

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
