# JOBHUNTMANAGER MVP仕様書

## 1. 概要

JOBHUNTMANAGERは、ユーザーごとの就職活動を管理するカンバン式SPAアプリである。

MVPでは、求人を登録し、応募状況をカンバンで管理し、応募に紐づく面接・タスク・メモを記録できる状態を完成条件とする。

### 技術構成

- バックエンド: Ruby on Rails API
- フロントエンド: React / TypeScript
- スタイリング: Tailwind CSS
- データベース: PostgreSQL
- 認証: Devise / devise-jwt / JTIMatcher

### MVPの基本方針

- Rails APIはRESTfulに実装する
- React側で画面遷移を行う
- ユーザーごとにデータを分離する
- カンバン専用テーブルは作成しない
- カンバンでは応募ステータスの変更のみ行う
- 同一列内の並び順は `updated_at DESC` とする
- 最初の完成に不要な検索、ページネーション、高度な集計は実装しない

---

## 2. 認証仕様

MVPでは `devise-jwt` とJTIMatcherを使用したBearer JWT認証を採用する。

### 認証フロー

1. ユーザー登録またはログインに成功する
2. Rails APIがレスポンスの `Authorization` ヘッダーへJWTを設定する
3. ReactがJWTを `sessionStorage` に保存する
4. 認証が必要なAPIへ `Authorization: Bearer <JWT>` を付与する
5. 画面再読み込み時は `sessionStorage` のJWTを使用して `/api/v1/auth/me` を呼び、認証状態を復元する
6. ログアウト成功時はJWTを失効させ、`sessionStorage` から削除する

### 認証上の制約

- `users` テーブルへJTIMatcher用の `jti` カラムを追加する
- JWTは `localStorage` へ保存しない
- JWTはブラウザタブを閉じるまで有効な `sessionStorage` に保存する
- APIキー認証は採用しない
- Cookie認証は採用しない
- 本番環境ではHTTPSを必須とする
- CORSはReactアプリのオリジンのみに制限する
- CORSの公開ヘッダーに `Authorization` を含める

---

## 3. MVPの機能一覧

### 3.1 ユーザー認証

- ユーザー登録
- ログイン
- ログアウト
- ログインユーザー情報の取得
- 画面再読み込み時の認証状態復元
- 未認証ユーザーの管理画面アクセス制限

### 3.2 企業・求人管理

- 企業一覧の取得
- 企業の新規登録
- 求人の登録・一覧表示・詳細表示・編集・削除
- 求人フォーム内で既存企業を選択
- 求人フォーム内で新規企業を登録してから求人へ設定
- 企業名、求人名、雇用形態、勤務地、求人URL、応募期限、求人内容の記録

企業専用画面は作成しない。企業詳細・更新・削除はMVP後に実装する。

### 3.3 応募管理

- 求人に対する応募の登録
- 応募日と応募ステータスの管理
- 応募詳細の表示
- 応募情報の編集・削除
- 同じユーザーによる同一求人への重複応募防止

### 3.4 カンバン

- 応募を以下のステータス別に表示
- ドラッグ＆ドロップによるステータス変更
- 各列の応募を `updated_at DESC` で表示

カンバンステータス:

1. 応募済み
2. 書類選考中
3. 面接予定
4. 内定
5. 見送り

同一列内の手動並び替えと表示順保存はMVPでは実装しない。

### 3.5 面接管理

- 応募ごとの面接登録・編集・削除
- 今後の面接予定一覧
- 面接種別、実施日時、場所、オンラインURL、担当者、状態、選考結果、補足の管理
- 面接登録時に応募ステータスを自動変更しない

### 3.6 タスク管理

- 応募ごとのタスク登録・編集・削除
- 未完了タスク一覧
- 期限、優先度、完了状態の管理
- 期限超過の表示

### 3.7 メモ管理

- 応募ごとのメモ一覧
- メモの登録・編集・削除
- 面接所感、企業研究、連絡事項などの自由記述

応募の補足情報はメモへ集約し、`applications` に選考結果用の自由記述カラムは持たせない。

---

## 4. 画面一覧

| 画面 | パス案 | 主な機能 |
| --- | --- | --- |
| ユーザー登録 | `/signup` | 名前、メールアドレス、パスワードの登録 |
| ログイン | `/login` | ログイン |
| カンバン | `/kanban` | 応募一覧、ステータス変更 |
| 求人一覧 | `/jobs` | 求人一覧、求人追加 |
| 求人登録 | `/jobs/new` | 企業選択・企業登録、求人登録 |
| 求人詳細 | `/jobs/:id` | 求人情報、応募情報の表示 |
| 求人編集 | `/jobs/:id/edit` | 求人情報の編集 |
| 応募詳細 | `/applications/:id` | 応募、面接、タスク、メモの表示・管理 |
| 面接予定一覧 | `/interviews` | 今後の面接予定 |
| タスク一覧 | `/tasks` | 未完了、完了、期限超過タスク |

企業専用画面、パスワード再設定画面、アカウント設定画面はMVP対象外とする。

---

## 5. ユーザーフロー

### 5.1 初回利用

1. ユーザー登録を行う
2. JWTを `sessionStorage` に保存する
3. 空のカンバンを表示する
4. 求人登録画面を開く
5. 既存企業を選択するか、求人フォーム内で企業を新規登録する
6. 求人を登録する
7. 求人詳細から応募を登録する
8. 応募カードが「応募済み」列に表示される

### 5.2 企業を新規登録して求人を作成する

1. 求人フォームで企業の新規登録を選択する
2. Reactが企業登録APIを呼ぶ
3. 作成された企業IDを求人フォームへ設定する
4. Reactが求人登録APIを呼ぶ

求人登録に失敗しても、作成済み企業は企業一覧に残り、再利用できる。

### 5.3 応募状況を更新する

1. カンバン画面を開く
2. 応募カードを別のステータス列へ移動する
3. 応募更新APIで `status` のみ更新する
4. 移動した応募は更新先の列の先頭へ表示する

### 5.4 面接・タスク・メモを管理する

1. 応募詳細を開く
2. 面接、タスク、メモを登録・更新する
3. 必要に応じて応募ステータスを利用者が手動変更する

面接登録による応募ステータスの自動変更は行わない。

### 5.5 再読み込み時の認証復元

1. Reactが `sessionStorage` からJWTを取得する
2. `/api/v1/auth/me` を呼ぶ
3. 成功時はログイン状態を復元する
4. `401 Unauthorized` の場合はJWTを削除し、ログイン画面へ遷移する

---

## 6. データモデル概要

### users

Deviseで作成済みのユーザー。JTIMatcher用の `jti` を追加する。

### companies

ユーザーが登録した企業。`user_id` を持つ。

### job_postings

企業に紐づく求人。`user_id` と `company_id` を持つ。

給与情報はMVPでは扱わない。

### applications

求人への応募。`user_id` と `job_posting_id` を持ち、カンバンカードとして表示する。

同一列内の並び順カラムは持たない。

### interviews

応募に紐づく面接。`user_id` は持たず、`application` 経由で所有者を判定する。

### tasks

応募に紐づくタスク。`user_id` は持たず、`application` 経由で所有者を判定する。

### notes

応募に紐づくメモ。`user_id` は持たず、`application` 経由で所有者を判定する。

---

## 7. モデル関連図

```mermaid
erDiagram
    USER ||--o{ COMPANY : owns
    USER ||--o{ JOB_POSTING : owns
    USER ||--o{ APPLICATION : owns

    COMPANY ||--o{ JOB_POSTING : has
    JOB_POSTING ||--o| APPLICATION : receives
    APPLICATION ||--o{ INTERVIEW : has
    APPLICATION ||--o{ TASK : has
    APPLICATION ||--o{ NOTE : has
```

### Railsモデルの関連

```text
User
├── has_many :companies
├── has_many :job_postings
└── has_many :applications

Company
├── belongs_to :user
└── has_many :job_postings

JobPosting
├── belongs_to :user
├── belongs_to :company
└── has_one :application

Application
├── belongs_to :user
├── belongs_to :job_posting
├── has_many :interviews
├── has_many :tasks
└── has_many :notes

Interview / Task / Note
└── belongs_to :application
```

---

## 8. 削除方針

| 対象 | MVPでの削除 |
| --- | --- |
| Company | 紐づく求人がある場合は削除拒否。企業削除API自体をMVPでは提供しない |
| JobPosting | 応募がある場合は削除拒否 |
| Application | 確認後に削除可能。面接、タスク、メモを連鎖削除 |
| Interview | 削除可能 |
| Task | 削除可能 |
| Note | 削除可能 |
| User | アカウント削除はMVP対象外 |

履歴を誤って失わないよう、CompanyとJobPostingでは子データの連鎖削除を行わない。

---

## 9. MVP API概要

APIのベースパスは `/api/v1` とする。

### 認証

- ユーザー登録
- ログイン
- ログアウト
- ログインユーザー取得

### 企業

- 企業一覧
- 企業登録

### 求人

- 求人一覧
- 求人登録
- 求人詳細
- 求人更新
- 求人削除

### 応募・カンバン

- 応募一覧
- 応募登録
- 応募詳細
- 応募更新・ステータス変更
- 応募削除

### 面接

- 面接予定一覧
- 面接登録
- 面接更新
- 面接削除

### タスク

- タスク一覧
- タスク登録
- タスク更新
- タスク削除

### メモ

- 応募別メモ一覧
- メモ登録
- メモ更新
- メモ削除

子リソースの単独詳細取得APIは作成しない。

---

## 10. API・実装共通ルール

- 認証API以外では `before_action :authenticate_user!` を使用する
- 作成・更新ではStrong Parametersを使用する
- `user_id` はリクエストパラメータに含めない
- Company、JobPosting、Applicationは `current_user` の関連から取得する
- Interview、Task、Noteは `current_user.applications` を経由して取得する
- 他ユーザーのデータを指定した場合は `404 Not Found` を返す
- 一覧取得では必要な関連を `includes` または `preload` し、N+1を防ぐ
- 日時はUTCで保存し、ISO 8601形式で返す
- enumはAPIで文字列として扱う

---

## 11. MVP後に追加する機能

- 同一列内の手動並び替え
- 企業詳細、企業更新、企業削除
- 子リソースの単独詳細取得API
- 検索、フィルター
- ページネーション
- 給与情報
- パスワード再設定
- アカウント設定・アカウント削除
- `409 Conflict` を使用する競合制御
- `429 Too Many Requests` を使用するレート制限
- 高度なレスポンス形式
- カンバンカードへの次回面接・次回タスク表示
- ダッシュボード・分析
- ファイル管理
- 通知
- カレンダー連携
- タグ
- CSV入出力
- ステータス・カンバン列のカスタマイズ
- 求人への複数回応募
- ソーシャルログイン、二要素認証
- リアルタイム同期

---

## 12. MVP実装順序

1. `users.jti` の追加とJWT認証
2. 企業一覧・登録
3. 求人CRUD
4. 応募CRUD
5. カンバン表示とステータス変更
6. 応募詳細
7. 面接管理
8. タスク管理
9. メモ管理
10. 所有権、削除制約、N+1、エラーレスポンスの確認
