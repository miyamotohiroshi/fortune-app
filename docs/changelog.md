# Changelog

## 2026-07-06 命式図の生年月日が1日ズレる不具合を修正（元命と月柱通変星の不一致）

### 背景・原因
- 命式図の「月柱の通変星（地支）」が、上部の元命（通変星・元命）と食い違う事例を確認（例: 元命=偏印 なのに命式表の月柱=印綬）。
- 原因は生年月日の日付取得。DBの `birthday` は日本時間(JST)の深夜0時で保存される（例: 1982-10-07 → `1982-10-06T15:00:00Z`）ため、`birthday.toISOString().split('T')[0]` で読むと **前日(10-06)** になり、`computeMeishiki` に1日早い日付を渡していた。結果、日柱が癸亥→壬戌、日干が癸→壬に化けて全通変星がズレていた（保存済み zodiacDayId・genmeiId は10-07基準で正しく、命式表だけが誤り）。

### 修正ファイル
- `src/lib/meishikiCalc.ts` — `computeMeishikiFromBirth(birthday, birthTime)` を追加。`birthday` を +9h して **JSTの暦日**を復元してから `computeMeishiki` を呼ぶ。保存済みの日柱(zodiacDayId)・元命(genmeiId) と必ず一致する
- `src/app/result/page.tsx` / `src/app/admin/history/[id]/page.tsx` — 手組みの `toISOString().split('T')` をやめ `computeMeishikiFromBirth` を使用
- （`src/app/try/result/page.tsx` はクエリの数値(YYYYMMDD)を直接渡しており元から正しいため変更なし）

### 検証
- よしるん（1982-10-07 08:26、DB上 `birthday=1982-10-06T15:00Z`, zodiacDayId=60=癸亥, genmeiId=9=偏印）で確認：修正後、命式表の日柱=**癸亥**（zodiacDayId一致）、月柱通変星(地支)=**偏印**（元命一致）となり食い違い解消
- `tsc --noEmit`・`npm run build` 通過

## 2026-07-06 命式図に五行・陰陽バランスと身強／身弱の判定を追加＋管理画面にも命式図を表示

### 修正ファイル
- `src/lib/meishikiCalc.ts` — `Meishiki` に `elements`（五行の個数 [木火土金水]）・`yin`/`yang`（陰陽の個数）・`strength`（身強弱判定）を追加。五行・陰陽は天干＋地支の8字を各1点で集計。身強弱は日主を強める星（比肩・劫財・偏印・印綬）と弱める星（食傷・財・官殺）の点数を比較し、月支（月令）を重み2で評価して `身強`／`中庸`／`身弱` を判定＋短い解説文を付与
- `src/components/fortune/MeishikiChart.tsx` — 表の下に「五行バランス（五行別カード＋バー）」「陰陽バランス（陰陽の割合バー）」「身強・身弱（バッジ＋味方/敵の点数＋解説）」を追加。集計方法の注記も表示
- `src/app/admin/history/[id]/page.tsx` — `computeMeishiki` で命式を算出し `ShichusuimeiSection` に `meishiki` を渡すよう修正。これで管理者が閲覧する他者の占断結果でも命式図・五行/陰陽・身強弱が表示される

### フロー・補足
- 命式図の直下に五行・陰陽の強弱と、全体としての身強／身弱（＋日主の五行）が一目で分かるようになった
- 命式図は自分の結果（/result）・お試し（/try/result）・管理履歴（/admin/history/[id]）の全経路で表示される
- 五行は色分けカード、身強＝暖色・身弱＝寒色・中庸＝グレーのバッジで視覚的に区別
- 型チェック（`tsc --noEmit`）・`npm run build` 通過。ブラウザで五行2/0/2/4/0・陰0/陽8・身弱（味方3/敵6）が正しく算出・描画されることを確認済み

## 2026-07-06 西洋占星術アスペクト占断文の全面刷新（フランク現代口語・全832件）＋本の核特徴で監査補強

### 新規ファイル
- `prisma/pair-desc-enriched.ts` — 全ペア546件の膨らませ版（フランク現代口語）。seedで最後にspreadし既存 PAIR_DESC_1..6 を上書き
- `prisma/triple-desc-enriched.ts` — 全トリプル286件の膨らませ版。seedで最後にspreadし既存 TRIPLE_DESC_* を上書き

### 修正ファイル
- `prisma/astrology-seed.ts` — `PAIR_DESC_ENRICHED` / `TRIPLE_DESC_ENRICHED` をimportし、各ALLマップの末尾でspreadして全上書き
- `prisma/pair-desc-enriched.ts` — 監査で核が抜けていた金星×冥王星7件（魔力/美しさ/運命的な恋）ほかペア2件を書き直し
- `prisma/triple-desc-enriched.ts` — 監査でトリプル25件を書き直し（例: 月・水星・土星は本と逆だった慎重派→移り気に是正）

### フロー・補足
- 文体は「フランクな現代口語」に刷新（です・ます維持、話しかける口調、カギ括弧で気持ち代弁、断定的・宿命的表現は回避）。参照元は docs/出生.pdf（本文は転記せずオリジナル書き起こし）
- 温度感の強調は引き続きUIのみ（合・矩・衝の暖色＋「強」バッジ）
- 生成→ID全件検証→title決定生成→enrichedファイル書き出し→`npm run seed:astrology` の流れ。全マルチエージェントWorkflowで実施
- 監査Workflowで全832件を「本の核特徴を拾えているか」で点検し、抜けが目立つ27件のみ補強（多くのセクションは修正不要）
- 旧 pair-desc-1..6 / triple-desc-1..5 / triple-desc-sun はenrichedで完全上書きされ実質未使用（削除禁止ルールにより非破壊で保持）

## 2026-07-06 四柱推命の性格占断に命式図（四柱一覧表）を追加

### 新規ファイル
- `src/lib/meishikiCalc.ts` — 生年月日＋出生時刻から四柱命式を算出。年柱（立春を境界）・月柱（節入り＋五虎遁）・日柱（既存の干支ID流用）・時柱（2時間区切り＋五鼠遁）の天干／地支／蔵干／通変星（天干・地支本気）／十二運／通根・無根を計算。表示用の定数（十干・十二支・五行・通変星・十二運名）とヘルパーもエクスポート
- `src/components/fortune/MeishikiChart.tsx` — 命式図を描画する表コンポーネント。列は左から**年・月・日・時**の順。天干・地支・蔵干・通変星（天干）・通変星（地支）・十二運（パワー★）を行に並べ、五行で淡く色分け。日柱列を強調表示。出生時刻未登録時は時柱を「—」表示＋注記

### 修正ファイル
- `src/components/fortune/ShichusuimeiSection.tsx` — `meishiki` プロップを追加し、元命セクションの下に区切り線＋`MeishikiChart` を表示
- `src/app/result/page.tsx` — `computeMeishiki` で命式を算出（暦日は元命計算と同一ソース、時刻は `user.birthTime`）し `ShichusuimeiSection` に渡す
- `src/app/try/result/page.tsx` — 同上（お試しフロー。クエリの生年月日・出生時刻から算出）

### フロー・補足
- 命式は四柱推命タブ（tab0）の最下部に配置。列順は依頼どおり左→右で年月日時
- 通根／無根は「天干の五行が、全地支の蔵干（余気を除く中気・本気）に存在するか」で判定。通変星（天干）は日柱＝日主のため空欄
- タイムゾーン依存を避けるため計算は暦日（年・月・日）を明示的に受け取る設計。年柱の立春境界・月柱の節入りは既存の `solarTerms.ts`（Meeus 太陽黄経）を利用
- 十二運のパワー★は帝旺/建禄=5〜死/墓/絶=1の5段階で表現

### 新規ファイル
- `prisma/triple-desc-sun.ts` — 太陽が絡むトリプル66件の膨らませた版。seedで最後にspreadし既存を上書き

### 修正ファイル
- `src/components/fortune/WesternAstrologySection.tsx` — 0°(合)・90°(矩)・180°(衝)のハードアスペクト行に暖色の左アクセント＋「強」バッジ＋暖色ラベルを追加（`HARD_ASPECTS` 定数）。温度感の強調はUI側で表現
- `prisma/pair-desc-1.ts` — 太陽ペア77件（11天体×7アスペクト）を書籍参照で膨らませて再生成（旧約90字→平均162字）
- `prisma/astrology-seed.ts` — `TRIPLE_DESC_SUN` をimportし `ALL_TRIPLE_DESC` の末尾でspread

### フロー・補足
- 参照元は「決定版 西洋占星術 実修 / 秋月瞳」の性格診断（docs/出生.pdf）。本文は転記せず意味を汲んでオリジナルに書き起こし、断定的・宿命的表現は中立・成長視点に調整
- 温度感は「UI強調のみ」の方針。文章トーンは全アスペクト共通で、アスペクト本来の意味で書き分け
- 太陽セクションで品質確認 → OKなら残り天体セクションへ段階展開する（全ペア546・トリプル286件が対象）
- 生成はマルチエージェントWorkflowで実施。`npm run seed:astrology` でDB投入済み

### 修正ファイル
- `src/components/fortune/TransitSection.tsx` — 表示を今年1年分から**今年を含めた5年分（今年〜4年先）**に変更。各年ぶんの `calculateTransitBands` を生成して `TransitTimeline` に渡すよう修正。見出しを年固定から「運気（トランシット）」に変更し、`todayISO` を算出して受け渡す
- `src/components/fortune/TransitTimeline.tsx` — `bands/year` 単体受け取りから `years[]`/`todayISO` 受け取りに変更。**年切替ボタン**を追加し、選択年のタイムラインを表示。現在の年には**今日マーカー（縦線・ラベル）**を表示。合0°・矩90°・衝180°の**メジャーアングルを★で強調**し、凡例を追加

### フロー・補足
- 運気タブで今年〜5年先までを年切替ボタンで閲覧できるようになった
- 型チェック（`tsc --noEmit`）通過を確認

## 2026-07-04 トランシット解説文の追加（第2弾：海王星・天王星・土星・木星／全180件完成）

### 修正ファイル
- `src/data/transit-master.ts` — 第1弾の冥王星36件に続き、**海王星・天王星・土星・木星の各36件（計144件）を追加**。これでトランシット5天体 × 出生12点 × 3区分（合／ソフト／ハード）= **全180件**が揃った。構成は第1弾と同じ（title・summary・events[]・howToSpend・caution）

### フロー・補足
- カバレッジチェックで全180キー（5×12×3）が欠落なく存在することを確認
- 木星は吉星のため、ハード区分も「〜の注意期」という軽めのトーンに調整（他の重い外惑星との差別化）
- 型チェック・lint通過。ブラウザで海王星〜木星の行クリック時にも「準備中」ではなく構成付き解説が展開されることを確認済み

## 2026-07-04 トランシット解説文の追加（第1弾：冥王星）

### 新規ファイル
- `src/data/transit-master.ts` — トランシット解説文マスター。キーは`${transitPlanet}-${natalPoint}-${category}`、categoryは合(conjunction)／ソフト(soft=三分・六分)／ハード(hard=矩・衝)の3区分。`aspectCategory(aspect)`ヘルパーでアスペクト→区分を判定。各エントリは`{ title, summary, events[], howToSpend, caution }`の構成。**第1弾としてトランシット冥王星×出生12点×3区分＝36件**を執筆（全体計画は5天体×180件）

### 修正ファイル
- `src/components/fortune/TransitTimeline.tsx` — 行クリック時のインライン詳細に、`TRANSIT_MASTER`から引いた解説（タイトル・概要・この時期に起きやすいこと・過ごし方・注意点）を表示。データ未整備の組は「解説文を準備中です」を表示

### フロー・補足
- ユーザー確認済み方針: 構成つき（しっかり）／ソフト・ハードでまとめる3区分（計180件）／天体ごとに分割して順次作成
- 今回は冥王星分（36件）まで。ブラウザで冥王星の行クリック→構成付き解説が行直下に展開表示されることを確認済み
- 残りの海王星・天王星・土星・木星分（各36件＝計144件）はレビュー後に順次追加予定

## 2026-07-04 トランシット表のラベル簡素化・詳細のインライン表示

### 修正ファイル
- `src/components/fortune/TransitTimeline.tsx` — 2点修正:
  - 行ラベルから見にくかった惑星グリフ（♇♆♅♄♃）とアスペクト記号（△⚹☌等）を削除。「T 冥王星 × MC」「トライン」のテキストのみに簡素化（不要になった`TRANSIT_SYMBOLS`定数と`ASPECT_SYMBOLS`importを除去）
  - 行クリック時の詳細（日付レンジ・最接近日）を、表の最下部ではなく**クリックした行のすぐ下**にインライン展開するよう変更（各行を`<div>`でラップし、選択時にその直下へ詳細ブロックを描画）

### フロー・補足
- ブラウザで確認: ラベルが記号なしで読みやすくなったこと、任意の行をクリックすると詳細がその行の直下に表示されることを確認済み

## 2026-07-03 トランシット法「今年の運気」年間タイムラインタブを追加

### 新規ファイル
- `src/lib/astrology/transit.ts` — トランシット計算ロジック。対象トランシット天体は外惑星5つ（冥王星・海王星・天王星・土星・木星＝この順が表示優先度）、出生12点（太陽〜冥王星＋ASC・MC）、メジャー5アスペクト（合・衝・矩・三分・六分）。`getTransitOrb`でオーブ・マトリクス（出生点グループ×トランシット天体で1〜5°）を実装。`calculateTransitBands`が指定年を日単位で走査し、オーブ内の連続期間（バンド）を抽出（逆行で年内に複数回入る場合は複数バンド）、各バンドの最接近日（最小orb）を保持し、トランシット→出生点→アスペクト→開始日順でソート
- `src/components/fortune/TransitSection.tsx` — サーバー側集計。`calculatePlanetPositions`で出生位置を出し、`new Date().getFullYear()`（＝今年）で`calculateTransitBands`を呼ぶ
- `src/components/fortune/TransitTimeline.tsx` — バーチャート型UI（Client）。横軸1〜12月、各行が「Tトランシット天体 × 出生点 アスペクト」。オーブ内期間を横棒で、最接近点をドットで強調。トランシット天体ごとに色分け（冥=紫/海=青/天=teal/土=amber/木=緑）。行クリックで日付レンジの詳細を表示

### 修正ファイル
- `src/components/fortune/ResultTabs.tsx` — オプションの4つ目タブ`tab3`に対応（渡された分だけ動的にタブ生成）。4つ目は「運気（今年）」
- `src/app/result/page.tsx` / `src/app/try/result/page.tsx` / `src/app/admin/history/[id]/page.tsx` — `ResultTabs`に`tab3={<TransitSection .../>}`を追加

### フロー・補足
- 対象年は「今年」を動的採用（実行時の年が自動で切り替わる）
- 生まれた時間・都市が未登録の場合はASC・MCへのトランシットを除外（既存挙動に合わせる）
- 1年に一度もオーブ内に入らない組は行自体を非表示
- アスペクトごとの詳細解説文は今回は未作成（後日追加予定。ラベル・データ構造は素直に保持）
- 実装後、計算ロジックを直接呼び出して並び順（冥王星が先頭・木星が末尾）と逆行による複数バンド分割を確認。ブラウザでも「運気」タブに27件のバンドが月位置どおりに描画され、最接近ドット・色分け・行選択が動作することを確認済み

## 2026-07-03 ハウス内天体の解説文をクリックで展開表示

### 新規ファイル
- `src/data/house-planet-master.ts` — 「天体×ハウス」の解説文マスター。キーは`${houseNum}-${planetKey}`（例: "10-sun"）、12ハウス×10天体=120件をClaudeが執筆。ハウスのテーマと各天体の意味を掛け合わせた特徴説明（各2〜3文）
- `src/components/fortune/HouseList.tsx` — ハウス一覧のClient Component。各ハウスに配置された天体名を`<button>`化し、クリックでその下に解説文をアコーディオン展開（同時に1件、再クリックで閉じるトグル）。選択中の天体はハイライト表示

### 修正ファイル
- `src/components/fortune/WesternAstrologySection.tsx` — 「ハウス」カード内のハウス一覧JSX（Server側にインライン記述されていた`houseCusps.map`）を`<HouseList>`に差し替え。「天体名をタップすると解説が表示されます」の案内文を追加。カードの外枠・見出し・`!hasTime`時の案内はServer側に維持

### フロー・補足
- 対象天体は太陽〜冥王星の10天体（ASC/MC/DESCはハウスの基準点でハウスに入らないため対象外）
- ブラウザで確認: 天体名クリックで解説パネルが展開、再クリックで閉じる、120件全てにテキストが存在する（キー欠落なし）ことを確認済み

## 2026-07-03 「3天体の組み合わせ」でASC・DESC・MCが2つ以上絡むものを非表示化

### 修正ファイル
- `src/components/fortune/WesternAstrologySection.tsx` — 「2天体のアスペクト」で導入した`ANGLE_POINTS`（ASC・DESC・MC）を流用し、`detectTripleAspects`の結果から3天体のうち`ANGLE_POINTS`が2つ以上含まれる組み合わせ（例: 太陽×ASC×MC）を除外する`visibleTripleAspects`を追加。感受点が1つまで（例: 月×土星×MC）の組み合わせは従来通り表示される

### フロー・補足
- ブラウザで確認: ASC・DESC・MCが2つ以上絡む組み合わせが一切表示されないこと、1つだけ絡む組み合わせ（「月×土星×MC」等）は引き続き表示されることを確認済み

## 2026-07-03 「2天体のアスペクト」からASC・DESC・MC絡みを非表示化

### 修正ファイル
- `src/components/fortune/WesternAstrologySection.tsx` — 「2天体のアスペクト」一覧に`visiblePairAspects`（ASC・DESC・MCを含むペアを除外したフィルタ済みリスト）を導入し、表示・DB問い合わせ・空表示判定をこちらに切り替え。計算自体（`detectPairAspects`の結果）とそれを使う3天体判定（`detectTripleAspects`）には手を加えていないため、ASC・DESC・MCが絡む2天体の判定は内部的に継続して行われ、「3天体の組み合わせ」ではこれらを含む組み合わせが引き続き表示される

### フロー・補足
- ブラウザで確認: 「2天体のアスペクト」一覧にASC・DESC・MCが一切表示されないこと、「3天体の組み合わせ」ではASC・DESC・MCを含む組み合わせが引き続き表示されることを確認済み

## 2026-07-02 人生年表の自動中央スクロールを修正

### 修正ファイル
- `src/components/fortune/DirectionLifeTab.tsx` — 表示時に今年の列を中央にスクロールする処理内で、列幅の定数`colWidth`が旧セル幅の`88`（px）のまま残っていた（先日セル幅を100pxに変更した際の反映漏れ）。`100`に修正し、今年の列が正しく画面中央に来るようにした

### フロー・補足
- ブラウザで確認: 今年の列（ハイライト表示）の中心座標とスクロールコンテナの中心座標が完全に一致（誤差0px）することを確認済み

## 2026-07-02 【重要】ASC（上昇点）の計算が180°反転していた不具合を修正

### 修正ファイル
- `src/lib/astrology/planets.ts` — `calcASCMC`内のASC算出式で、`atan2`に渡す引数（分子・分母）の符号が誤っており、結果が常に本来のASCから180°反転した位置（＝実際にはDESC側の位置）になっていた。`atan2(-cos(RAMC), sin(RAMC)cos(ε)+tan(φ)sin(ε))` → `atan2(cos(RAMC), -(sin(RAMC)cos(ε)+tan(φ)sin(ε)))`に修正

### 不具合の詳細・検証方法
- ユーザーから「1987/08/05 07:27 長野生まれ」のチャートでASCの位置がおかしいと報告があり、独立した方法で検証した
- 天文学的に「日の出の瞬間、ASCは太陽とほぼ同じ黄経になる」という性質を利用し、該当日時の長野での日の出時刻（4:55 JST）でASCを計算したところ、修正前は太陽（獅子座11.90°）に対しASCが水瓶座8.26°となり、約176°（≒180°）のズレがあることを確認。修正後は獅子座8.26°となり、太陽との差はわずか3.6°に収まった（正常範囲）
- 同様に「南中時、MCは太陽とほぼ同じ黄経になる」性質でMC側も検証し、MCの式には問題がないことを確認（修正対象はASCのみ）
- 別の都市・季節（大阪、2000年1月、日の出時刻）でも同様に検証し、修正後の誤差が2°未満に収まることを確認
- 実際の報告値（乙女座9°08'がASCになるべき）で修正後の値と一致することをブラウザで確認

### 影響範囲
- ASCを使用する全ての機能（性格占断のASC関連アスペクト、ハウス一覧、人生タブのASC絡みのダイレクション）に影響。生まれた時間・都市を登録している全ユーザーのASC・DESC・ハウスの計算結果が、この修正により正しい値に変わる（MCおよびASC/DESC以外の天体位置は影響なし）
- DB上の解釈テキスト（pair-desc・triple-desc・direction-master）は「アスペクトの種類ごとの意味」を記述したものであり、チャート個別の計算結果には依存しないため、テキスト自体の修正は不要だった

## 2026-07-02 性格占断（西洋占星術）にハウス一覧を追加

### 新規ファイル
- `src/lib/astrology/houses.ts` — イコールハウス方式（ASCを第1ハウスの起点として30°ずつ均等に12分割）でのハウスカスプ算出（`calculateHouseCusps`）と、各天体がどのハウスに入るかの判定（`assignPlanetsToHouses`）

### 修正ファイル
- `src/components/fortune/WesternAstrologySection.tsx` — 「天体位置」カードの下に「ハウス」カードを追加。第1〜第12ハウスそれぞれのカスプの星座・度数と、そのハウスに入っている天体を一覧表示。生まれた時間・都市が未登録の場合（ASCが算出できない場合）はASC/MC/DESCと同様に非表示にし、案内文を表示

### フロー・補足
- ハウス方式は「イコールハウス」を採用（ASCそのものを計算に使えるため実装がシンプルで確実。プラシーダス等の座標系依存の複雑な計算は使用していない）
- ASC・MC・DESCなどの感受点自体はハウスに「入る」対象とせず、太陽〜冥王星の10天体のみをハウス判定の対象とした
- 実装後、ブラウザで時間・都市ありのケースで第1〜12ハウス全てと配置天体が表示されること、時間未登録時は案内文のみ表示されることを確認済み

## 2026-07-02 「金星×火星」のメインアイコンを修正

### 修正ファイル
- `src/data/direction-master.ts` — 「金星 × 火星」の`mainIcon`を`⚠️`から`❤️`に変更

## 2026-07-02 人生年表グリッドのセル横幅を100pxに変更

### 修正ファイル
- `src/components/fortune/DirectionLifeTab.tsx` — 年表グリッドの列幅を88px→100px（`w-25`）に変更。横スクロール領域の`minWidth`計算も列幅×年数で連動して調整

## 2026-07-02 ダイレクションのカテゴリ修正（冥王星×ASC・冥王星×MC）

### 修正ファイル
- `src/data/direction-master.ts` — 「冥王星 × ASC」「冥王星 × MC」の`category`を`変容`から`転機`に修正

## 2026-07-02 ログインセッションを30日保持・ログイン済みでの/loginアクセスを自動リダイレクト

### 新規ファイル
- `src/app/login/LoginForm.tsx` — 従来`login/page.tsx`にあったログインフォームのClient Componentを分離

### 修正ファイル
- `src/lib/session.ts` — セッションの有効期限を7日→30日に変更（JWTの`setExpirationTime`とCookieの`expires`の両方）。`createSession`はsignup/login共通で使われるため、新規登録時のセッションも30日保持になる
- `src/app/login/page.tsx` — Server Componentに変更し、`getCurrentUser()`でログイン済みかどうかを判定。ログイン済みの場合は`/result`へ`redirect`し、未ログインの場合のみ`LoginForm`を表示するようにした

### フロー・補足
- Cookieは引き続きhttpOnly（JS非公開）のセッションCookieを使用。localStorageはXSS耐性がなくサーバーコンポーネントから直接参照できないため、認証情報の保持先としては採用せず、既存のCookie方式のまま保持期間だけ延長した
- ブラウザで確認: 新規登録直後のセッションCookieの有効期限が30日後になっていること、ログイン中に`/login`へアクセスすると`/result`に自動リダイレクトされること、ログアウト後は通常通りログインフォームが表示されることを確認済み

## 2026-07-02 管理者向け導線を「自分の結果／占断履歴」タブに統一

### 新規ファイル
- `src/components/admin/AdminTabNav.tsx` — 管理者専用のタブ型ナビゲーション（「自分の結果」→`/result`、「占断履歴」→`/admin/history`）。アクティブなタブを紫グラデーションでハイライト表示

### 修正ファイル
- `src/app/result/page.tsx` — `role === 'admin'`の場合、ヘッダー上部に`AdminTabNav`（`active="self"`）を表示。従来ヘッダー右上にあった占断履歴への導線アイコンは`AdminTabNav`に統合したため削除
- `src/app/admin/history/page.tsx` — ヘッダー上部に`AdminTabNav`（`active="history"`）を追加。タブに統合されたため、フッターの「← 自分の占い結果へ戻る」リンクを削除
- `src/app/admin/history/[id]/page.tsx` — ヘッダー上部に`AdminTabNav`（`active="history"`）を追加。削除ボタンは履歴一覧画面のみに残す方針のため、この画面（他の人の占断結果）からは削除ボタンを撤去

### フロー・補足
- 削除操作は`/admin/history`の一覧画面からのみ行える（誤操作防止・操作導線の一本化）
- ブラウザで確認: `/result`では「自分の結果」がアクティブ、`/admin/history`・`/admin/history/[id]`では「占断履歴」がアクティブになり、削除ボタンは一覧画面にのみ表示されることを確認済み

## 2026-07-02 人生年表の詳細カードに重要度を表示

### 修正ファイル
- `src/components/fortune/DirectionLifeTab.tsx` — `DetailCard`のヘッダー（アスペクト種別・角度の行）に`重要度 {master.importance}`を追加表示。「スクエア（矩） 90°　重要度 8」のように角度の直後に表示される

## 2026-07-02 人生年表グリッドのDESCラベル欠落を修正

### 修正ファイル
- `src/components/fortune/DirectionLifeTab.tsx` — 人生年表グリッドのセルラベル生成に使う`PLANET_SHORT`（惑星キー→短縮表記のマップ）に`desc: 'DESC'`が抜けていたため追加。DESC絡みの方位が「木× 90°」のように片側の表記が空白になっていた不具合を修正し、「木×DESC 90°」のように正しく表示されるようにした

### フロー・補足
- 同種の惑星名マッピングは`constants.ts`・`directions.ts`・`WesternAstrologySection.tsx`にも存在するが、いずれも前回のDESC対応で追加済みで漏れなし。今回の`DirectionLifeTab.tsx`だけ見落としていた
- ブラウザで生年月日・時刻・都市を指定して人生年表を表示し、「太×DESC」「DESC×木」等が正しく表示されることを確認済み

## 2026-07-02 DESC（ディセンダント）対応を追加

### 新規ファイル
- `prisma/pair-desc-6.ts` — DESCと他12天体/感受点の2天体アスペクト解釈（12ペア×7アスペクト=84件、Claude執筆）
- `prisma/triple-desc-5.ts` — DESCを含む3天体組み合わせ解釈（C(13,3)-C(12,3)=66件、Claude執筆）

### 修正ファイル
- `src/lib/astrology/constants.ts` — `PLANET_KEYS`に`'desc'`追加。`PLANET_NAMES_JA`・`PLANET_ORB_WEIGHT`（ASC/MCと同格の10）にdescを追加
- `src/lib/astrology/planets.ts` — `calculatePlanetPositions`でDESC座標を`ASC + 180°`として算出し返却するよう追加
- `src/lib/astrology/aspects.ts` — `detectPairAspects`・`detectTripleAspects`の「時刻未登録時に除外する感受点」フィルタにdescを追加
- `src/lib/astrology/directions.ts` — `PLANET_JA`にdesc追加。同様の時刻フィルタにもdesc追加
- `src/components/fortune/WesternAstrologySection.tsx` — `PLANET_SYMBOLS`に`desc: 'DC'`追加。天体位置一覧の非表示条件・案内文にdescを追加
- `prisma/astrology-seed.ts` — `PLANET_KEYS`・`PLANET_INFO`にdesc追加。`PAIR_DESC_6`・`TRIPLE_DESC_5`をインポートしマージ。件数コメントを462/220→546/286に更新
- `prisma/schema.prisma` — `AspectPairData`/`AspectTripleData`のコメント件数を66ペア×7=462件→78ペア×7=546件、C(12,3)=220件→C(13,3)=286件に更新
- `src/data/direction-master.ts` — 人生タブ（ダイレクション法）にDESC絡み12件（太陽×DESC〜MC×DESC）を追加。ユーザー提供CSV（`data_direction_added-desc.csv`）を反映

### 不具合修正（実装中に発覚）
- 提供CSVのうち12件中9件は、スプレッドシート由来と思われる列ズレ（「影響を受けやすい分野」のJSONが1列右の「この時期の過ごし方」列に入り、以降のタグ・おすすめ行動・注意ポイントも道連れで1列ずつズレる）があった。内容の意味からズレを検出し、正しい列に補正して反映した
- 当初、DESCコンテンツ（人生タブのCSV12件・性格診断の150件）を追加するだけでは実際には表示されないことが判明。`PLANET_KEYS`（計算ロジックの起点）にdescが無いと、実際のアスペクト検出・ダイレクション計算で一切マッチしないため、計算ロジック側（上記5ファイル）の拡張も本対応に含めた

### フロー・補足
- DESC = ASC + 180°（下降点）として算出。ASC/MC同様、生まれた時間・都市が未登録の場合は計算・表示ともに非表示になる
- `npx tsx prisma/astrology-seed.ts` で新規150件（ペア84+トリプル66）をDBにupsert。既存462+220件は非破壊
- 実装後、`calculateDirectionAspects`を直接呼び出してDESC絡みの方位が実際に検出されること、`DIRECTION_MASTER_MAP`との紐付けが全12件正しく機能することを確認済み。ブラウザでも性格診断タブ・人生タブの双方でDESCが表示されることを確認した

## 2026-07-02 占断履歴の編集機能を追加

### 新規ファイル
- `src/app/admin/history/[id]/edit/page.tsx` — 履歴1件の編集フォーム画面。既存の名前・生年月日・時刻・都市を初期値としてセット
- `src/app/admin/history/[id]/edit/EditHistoryForm.tsx` — 編集フォームのClient Component（`/admin/lookup`と同UI構成、送信は`updateHistoryEntry`にバインド）

### 修正ファイル
- `src/app/actions/adminHistory.ts` — Server Action `updateHistoryEntry(id, prevState, formData)` を追加。バリデーション・干支/元命の再計算後、`FortuneHistory`を更新。`@@unique([adminUserId, name, birthday])`と衝突する編集（既存の別履歴と同じ名前・生年月日に変更しようとした場合）はエラーメッセージを返し、更新を中断
- `src/app/admin/history/page.tsx` — 一覧の削除ボタンの左に「編集」リンク（`/admin/history/[id]/edit`）を追加

### 不具合修正（実装中に発覚）
- 履歴編集フォームの生年月日プリフィルが「`Date.toISOString().split('T')[0]`でUTC変換 → タイムゾーン差で前日にずれる」バグを持っていた（JST環境で1980-01-01が1979-12-31と表示される）。`getFullYear()`/`getMonth()`/`getDate()`のローカルgetterで組み立てる方式に修正。同種のパターンが`src/app/account/page.tsx`にも存在するため、必要であれば別途修正を検討
- 重複エラー（P2002）を`e instanceof Prisma.PrismaClientKnownRequestError`で判定していたが、Turbopackのバンドル環境ではモジュール実体がずれ`instanceof`が失敗し、500エラーになっていた。`e.code === 'P2002' || e.code === '23505'`という値ベースの判定に変更して修正

### フロー・補足
- 編集後は`/admin/history/[id]`（結果表示）にリダイレクトし、再計算された占い結果がすぐ確認できる
- 名前・生年月日を他の既存履歴と重複する内容に変更しようとした場合は保存されず、フォームにエラーメッセージが表示される（データは壊れない）

## 2026-07-02 管理者用「占断履歴」機能を追加

### 新規ファイル
- `src/app/admin/layout.tsx` — `/admin/*` 配下の権限ガード。未ログインは`/login`へ、`role !== "admin"`は`/`へリダイレクト
- `src/app/admin/lookup/page.tsx` — 管理者が占断対象者の名前・生年月日（任意で時刻/都市）を入力するフォーム。`/try`の入力フォームと同構成
- `src/app/admin/history/page.tsx` — 管理者本人に紐づく占断履歴の一覧（名前・最終更新日、削除ボタン付き）
- `src/app/admin/history/[id]/page.tsx` — 履歴1件の詳細表示。`/try/result`と同じ`ResultTabs`構成で結果を再現
- `src/app/admin/history/DeleteHistoryButton.tsx` — 確認ダイアログ付きの削除ボタン（Client Component）
- `src/app/actions/adminHistory.ts` — Server Actions: `lookupAndSaveHistory`（計算して`FortuneHistory`にupsert保存）、`deleteHistory`（所有者チェック付き削除）

### 修正ファイル
- `prisma/schema.prisma` — `User`に`role`（デフォルト`"user"`）を追加。新規モデル`FortuneHistory`（`adminUserId`+`name`+`birthday`でユニーク制約、同一人物の再検索は上書き）を追加
- `src/lib/session.ts` — `getCurrentUser()`を追加（セッションからユーザーレコード取得を共通化）
- `src/app/result/page.tsx` — `role === "admin"`のユーザーにのみ`/admin/history`への導線アイコンを表示

### フロー・補足
- 管理者権限のあるアカウントでログインした場合のみ、他人（占断対象者）を名前・生年月日で検索でき、結果は自動的に履歴として保存される
- 同じ名前・生年月日で再検索すると既存の履歴を上書き（1人1レコード）。生年月日が異なれば別人として新規レコードになる
- 履歴一覧から名前をクリックすると過去の結果に切り替えられ、削除ボタン（確認ダイアログあり）で完全削除できる
- 管理者への昇格はUIを設けておらず、DBの`User.role`を直接`"admin"`に更新する必要がある（例: `npx prisma studio`）
- DBスキーマ反映は`npx prisma migrate dev`ではなく`npx prisma db push`で実施。このプロジェクトは元々`prisma/migrations`履歴を持たずDBが構築されていたため、`migrate dev`はdrift検出により全データリセットを提案してくる。既存データを保持するため`db push`を使用した

## 2026-07-01 月絡みアスペクト4件のデータ修正を反映

### 修正ファイル
- `src/data/direction-master.ts` — data_direction_fix2.csv を全面反映（64行）。月絡み4件（太陽×月・月×土星・月×天王星・月×冥王星）のカテゴリ・テーマ・アイコン・各種フィールドを更新。`DirectionCategory` 型に `変容` を追加

### フロー・補足
- 太陽×月: チャンス→転機、mainTheme「新たなスタート」🌀
- 月×土星: mainTheme「試練」🔥、subTheme「忍耐」✨
- 月×天王星: mainTheme「意識改革」🌀
- 月×冥王星: 転機カテゴリ、mainTheme「再生」🌀

## 2026-07-01 人生タブ用CSVマスターデータを新版に差し替え・DetailCardに4項目を追加

### 修正ファイル
- `src/data/direction-master.ts` — CSVデータを新版（64行）に全面差し替え。型に `likelyEvents: string[]`, `affectedAreas?: Record<string, number>`, `howToSpend?: string`, `afterOvercoming?: string` を追加
- `src/components/fortune/DirectionLifeTab.tsx` — DetailCard に「起こりやすい出来事」（箇条書き）・「影響を受けやすい分野」（■■■■□ バー）・「この時期の過ごし方」・「乗り越えた先」セクションを追加。各フィールドが空の場合はセクション全体を非表示

### フロー・補足
- 起こりやすい出来事は `・` 付きリスト（先頭 `・` を除去して表示）
- 影響を受けやすい分野は JSON `{"仕事":5,...}` を 0–5 スコアで ■/□ に変換して表示
- タイムライン年表ロジックは変更なし

## 2026-06-30 会員情報ページ（/account）を追加・結果ページにアカウントボタン設置

### 新規ファイル
- `src/app/account/page.tsx` — Server Component：セッションからユーザー情報を取得してAccountFormに渡す
- `src/app/account/AccountForm.tsx` — Client Component：名前・生年月日・生まれた時間・生まれた都市を編集できるフォーム（メールは表示のみ）
- `src/app/actions/account.ts` — Server Action `updateProfile`：nickname/birthday/birthTime/birthCityをDBに保存。生年月日変更時はzodiacDayId・genmeiIdを再計算

### 修正ファイル
- `src/app/result/page.tsx` — ヘッダー右上にアカウントアイコンボタン（/accountへのLink）を追加

### フロー・補足
- 結果ページ右上の人物アイコン → /account → 情報編集して「変更を保存する」→ 成功メッセージ表示 → 「占い結果に戻る」で/resultへ

## 2026-06-30 ログインページのデザインをトンマナ統一

### 修正ファイル
- `src/app/login/page.tsx` — ライトテーマ（白背景・青系ボタン）からダークテーマ（`#07071A`背景・パープルアクセント・グラデーションボタン）に全面リデザイン。フローティングラベル入力・パスワード表示切替・背景グロー追加

### フロー・補足
- メール・パスワード入力はトップページ会員登録フォームと同じフローティングラベルスタイルを採用

## 2026-06-30 無料体験→会員登録：名前文字化けと時刻・都市未引継ぎを修正

### 修正ファイル
- `src/app/actions/fortune.ts` — `encodeURIComponent` を除去（URLSearchParamsが自動エンコードするため二重エンコードになっていた）
- `src/app/try/result/page.tsx` — signupUrlにbirthTime・birthCityを追加。nicknameはNext.jsが自動デコードするためdecodeURIComponent不要に整理
- `src/app/page.tsx` (SignupForm) — searchParamsからbirthTime・birthCityを読み込み、時刻入力欄（birthHour/birthMinute）と都市セレクトにdefaultValueとして渡すよう追加

### フロー・補足
- `/try`フォーム送信 → `/try/result` → 「会員登録する」→ `/`（SignupForm）の全経路で名前・誕生日・時刻・都市が正しく引き継がれるようになった

## 2026-06-30 人生タブ：ダイレクション法による人生年表UI実装

### 新規ファイル
- `src/data/direction-master.ts` — CSVマスターデータをTypeScript定数化（64アスペクト、タグ・行動・注意ポイント含む）
- `src/lib/astrology/directions.ts` — ソーラーアーク・ダイレクション計算エンジン（DIRECTION_IMPORTANCE_THRESHOLD=8定数含む）
- `src/components/fortune/DirectionLifeSection.tsx` — Server Component：ダイレクション計算を実行してクライアントへデータ渡し
- `src/components/fortune/DirectionLifeTab.tsx` — Client Component：横スクロール年表UI（チャンス/転機/試練3段構成）・詳細カード表示

### 修正ファイル
- `src/app/result/page.tsx` — tab2を準備中プレースホルダーからDirectionLifeSectionへ置き換え

### フロー・補足
- 出生年〜90才の期間、各年のソーラーアーク（太陽の移動量）を算出し全天体にアーク適用
- ダイレクション天体とネイタル天体のアスペクトを検出（オーブ1°以内）
- 重要度>=8のアスペクトのみ表示（閾値定数で変更可能）
- 各年を横スクロールで閲覧、アスペクトをクリックで詳細カード表示（タグチップ・行動・注意）
- 現在年付近に初期スクロール位置を自動調整

## 2026-06-30 西洋占星術の基本実装（天体位置・アスペクト・トリプル）

### 新規ファイル
- `src/lib/astrology/constants.ts` — PLANET_KEYS, ASPECT_ANGLES, オーブ重みなど定数定義
- `src/lib/astrology/cities.ts` — 都市別の緯度経度テーブル（日本全国 + 主要海外都市）
- `src/lib/astrology/planets.ts` — astronomy-engine を使って全12天体（太陽〜MC）の黄道経度を計算
- `src/lib/astrology/aspects.ts` — ペア・トリプルアスペクト検出ロジック（オーブ規則適用）
- `src/components/fortune/WesternAstrologySection.tsx` — 結果ページ用 Server Component
- `prisma/astrology-seed.ts` — AspectPairData (462件) + AspectTripleData (220件) のシードスクリプト

### 修正ファイル
- `prisma/schema.prisma` — `AspectPairData` / `AspectTripleData` モデルを追加
- `src/app/result/page.tsx` — 「COMING SOON」プレースホルダーを `WesternAstrologySection` に置き換え
- `package.json` — `seed:astrology` スクリプトを追加（`npx tsx prisma/astrology-seed.ts`）

### フロー・補足
- 天体位置: `SunPosition` / `GeoVector + Ecliptic` で黄道経度を取得、12星座に変換して表示
- ASC/MC: `SiderealTime` から地方恒星時 → RAMC → 古典公式で計算（生まれ時間・都市が必要）
- オーブ: 45°/135°は常に1°; その他は2天体のオーブ重みの最大値（ASC/MC=10, 太陽/月=6, 水〜土=5, 天/海/冥=4）
- アスペクト: 0°/180°/90°/60°/120°/45°/135° の7種類
- トリプル: 3天体すべてがペアアスペクトにある場合のみ検出（天体組み合わせのみで説明文を管理）
- 説明文: AI生成のプレースホルダー（計462+220件）をDBに格納。後から研究済み説明文に差し替え予定

## 2026-06-30 西洋占星術アスペクト説明文の研究済みデータ投入

### 新規ファイル
- `prisma/pair-desc-1.ts` — ペア説明文 Part1: 太陽×11天体 全7アスペクト（77件）
- `prisma/pair-desc-2.ts` — ペア説明文 Part2: 月×10天体 全7アスペクト（70件）
- `prisma/pair-desc-3.ts` — ペア説明文 Part3: 水星×9天体 + 金星×8天体 全7アスペクト（119件）
- `prisma/pair-desc-4.ts` — ペア説明文 Part4: 火星×7天体 + 木星×6天体 全7アスペクト（91件）
- `prisma/pair-desc-5.ts` — ペア説明文 Part5: 土星〜MCの残り全ペア 全7アスペクト（105件）
- `prisma/triple-desc-1.ts` — トリプル説明文 Part1: 太陽絡み55件 + 月絡み部分30件（85件）
- `prisma/triple-desc-2.ts` — トリプル説明文 Part2: 月残り15件 + 水星36件（51件）
- `prisma/triple-desc-3.ts` — トリプル説明文 Part3: 金星28件 + 火星21件（49件）
- `prisma/triple-desc-4.ts` — トリプル説明文 Part4: 木星〜冥王星の残り全体（35件）

### 修正ファイル
- `prisma/astrology-seed.ts` — 全pair-desc-*.ts / triple-desc-*.tsをインポートし研究済み説明文を使用するよう刷新（フォールバック付き）

### フロー・補足
- 462件のペアアスペクト全てに西洋占星術の古典的解釈に基づく日本語説明文を投入
- 220件のトリプルアスペクト全てに3天体の統合テーマを記述した説明文を投入
- `npx tsx prisma/astrology-seed.ts` 実行でフォールバック0件・全件登録確認済み

## 2026-06-30 サインアップフォームUI改修（スケッチ対応）

### 修正ファイル
- `src/app/page.tsx` — 「─ 分かる場合のみ ─」区切り線追加、生まれた時間を時/分の別入力に変更、都市フィールド下に補足説明追加、メール・パスワードをフローティングラベルUIに変更（アイコン削除）
- `src/app/actions/auth.ts` — birthHour / birthMinute を "HH:MM" 形式に結合して保存するよう変更

### フロー・補足
- フローティングラベルは Tailwind `peer` + `:not(:placeholder-shown)` の CSS トリックで実装
- 時間入力は number type で入力、time type から変更（時・分の個別入力）
- placeholder に空白スペースを設定することで、未入力時は `:placeholder-shown` が true となり、入力後にラベルがアニメーションで左上に移動する

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
