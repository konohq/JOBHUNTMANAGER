# JOBHUNTMANAGER MVP API設計書

## 1. 概要

本書は [`spec.md`](./spec.md) と [`database_design.md`](./database_design.md) に基づくRails APIとReact SPA間のAPIを定義する。

### 基本方針

- ベースパスは `/api/v1`
- JSON形式で通信する
- RESTfulに設計する
- 認証はDevise、`devise-jwt`、JTIMatcherを使用する
- JWTはReactの `sessionStorage` に保存する
- APIキー認証とCookie認証は使用しない
- 認証API以外はJWT認証を必須とする
- enumは整数ではなく文字列で入出力する
- 日時はISO 8601形式のUTCで返す
- 検索とページネーションはMVPでは実装しない

---

## 2. 共通仕様

### 2.1 ベースURL

```text
http://localhost:3000/api/v1
```

React:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### 2.2 リクエストヘッダー

認証不要:

```http
Accept: application/json
Content-Type: application/json
```

認証必須:

```http
Authorization: Bearer <JWT>
Accept: application/json
Content-Type: application/json
```

### 2.3 JWT認証

1. ユーザー登録またはログイン成功時、APIが `Authorization` レスポンスヘッダーへJWTを設定する
2. ReactがJWTを `sessionStorage` へ保存する
3. ReactのAPIクライアントが認証済みリクエストへJWTを付与する
4. 画面再読み込み時は保存済みJWTで `/auth/me` を呼ぶ
5. `/auth/me` が成功した場合は認証状態を復元する
6. `401 Unauthorized` の場合はJWTを削除してログイン画面へ遷移する
7. ログアウト成功時はJTIMatcherでJWTを失効させ、`sessionStorage` から削除する

JWTは `localStorage` に保存しない。

Deviseがユーザーをサーバーセッションへ保存しないよう設定する。

```ruby
config.skip_session_storage = %i[http_auth params_auth]
```

`devise-jwt` では、ユーザー登録・ログインをJWT発行対象、ログアウトを失効対象として設定する。

```ruby
config.jwt do |jwt|
  jwt.secret = Rails.application.credentials.devise_jwt_secret_key!
  jwt.dispatch_requests = [
    [ "POST", %r{^/api/v1/auth$} ],
    [ "POST", %r{^/api/v1/auth/sign_in$} ]
  ]
  jwt.revocation_requests = [
    [ "DELETE", %r{^/api/v1/auth/sign_out$} ]
  ]
  jwt.expiration_time = 1.day.to_i
end
```

### 2.4 CORS

- 許可オリジンはReactアプリのオリジンに限定する
- 許可メソッドへ `GET`、`POST`、`PATCH`、`DELETE`、`OPTIONS` を設定する
- 許可ヘッダーへ `Authorization` と `Content-Type` を設定する
- 公開ヘッダーへ `Authorization` を設定する
- 本番環境ではHTTPSを使用する
- `rack-cors` は本番環境でも読み込めるよう、Gemfileのdevelopment/testグループ外へ配置する
- Bearer JWTのみを使うため、CORSの `credentials` は有効化しない

### 2.5 日付・日時

| 種類 | 形式 | 例 |
| --- | --- | --- |
| 日付 | `YYYY-MM-DD` | `2026-06-19` |
| 日時 | ISO 8601 UTC | `2026-06-19T06:30:00Z` |

### 2.6 enum

応募ステータス:

```text
applied
document_screening
interview_scheduled
offered
rejected
```

面接種別:

```text
casual
first
second
final
other
```

面接状態:

```text
scheduled
completed
canceled
```

面接結果:

```text
pending
passed
failed
```

タスク優先度:

```text
low
medium
high
```

### 2.7 成功レスポンス

単一リソース:

```json
{
  "data": {
    "id": 1,
    "name": "株式会社サンプル"
  }
}
```

一覧:

```json
{
  "data": []
}
```

削除成功は本文なしの `204 No Content` とする。

ページネーション用の `meta` など、高度なレスポンス構成はMVPでは使用しない。

### 2.8 エラーレスポンス

```json
{
  "error": {
    "code": "validation_error",
    "message": "入力内容を確認してください",
    "details": {
      "title": [
        "を入力してください"
      ]
    }
  }
}
```

他ユーザー所有のIDを指定した場合は、存在を推測されないよう `404 Not Found` を返す。

### 2.9 Strong Parameters

リクエストはリソース名をルートキーにする。

```json
{
  "company": {
    "name": "株式会社サンプル"
  }
}
```

`user_id` は許可パラメータに含めない。

---

## 3. MVPエンドポイント一覧

### 3.1 認証

| HTTP | エンドポイント | 認証 | 用途 |
| --- | --- | --- | --- |
| POST | `/api/v1/auth` | 不要 | ユーザー登録 |
| POST | `/api/v1/auth/sign_in` | 不要 | ログイン |
| DELETE | `/api/v1/auth/sign_out` | 必要 | ログアウト |
| GET | `/api/v1/auth/me` | 必要 | ログインユーザー取得 |

### 3.2 企業

| HTTP | エンドポイント | 認証 | 用途 |
| --- | --- | --- | --- |
| GET | `/api/v1/companies` | 必要 | 企業一覧 |
| POST | `/api/v1/companies` | 必要 | 企業登録 |

企業詳細、更新、削除APIはMVPでは作成しない。企業APIは既存機能として維持するが、MVP画面の簡易応募登録では直接呼び出さない。

### 3.3 求人

| HTTP | エンドポイント | 認証 | 用途 |
| --- | --- | --- | --- |
| GET | `/api/v1/job_postings` | 必要 | 求人一覧 |
| POST | `/api/v1/job_postings` | 必要 | 求人登録 |
| GET | `/api/v1/job_postings/:id` | 必要 | 求人詳細 |
| PATCH | `/api/v1/job_postings/:id` | 必要 | 求人更新 |
| DELETE | `/api/v1/job_postings/:id` | 必要 | 求人削除 |

求人APIは既存機能として維持するが、MVP画面の簡易応募登録では直接呼び出さない。

### 3.4 応募・カンバン

| HTTP | エンドポイント | 認証 | 用途 |
| --- | --- | --- | --- |
| GET | `/api/v1/applications` | 必要 | 応募一覧 |
| POST | `/api/v1/applications` | 必要 | 応募登録 |
| GET | `/api/v1/applications/:id` | 必要 | 応募詳細 |
| PATCH | `/api/v1/applications/:id` | 必要 | 応募日の更新 |
| DELETE | `/api/v1/applications/:id` | 必要 | 応募削除 |
| GET | `/api/v1/kanban` | 必要 | カンバン取得 |
| POST | `/api/v1/kanban/applications` | 必要 | 会社名と応募期限による簡易応募登録 |
| PATCH | `/api/v1/applications/:application_id/status` | 必要 | カンバンのステータス変更 |

同一列内の手動並び替えAPIはMVPでは作成しない。

### 3.5 面接

| HTTP | エンドポイント | 認証 | 用途 |
| --- | --- | --- | --- |
| GET | `/api/v1/interviews` | 必要 | 面接予定一覧 |
| POST | `/api/v1/applications/:application_id/interviews` | 必要 | 面接登録 |
| PATCH | `/api/v1/interviews/:id` | 必要 | 面接更新 |
| DELETE | `/api/v1/interviews/:id` | 必要 | 面接削除 |

面接単独の詳細取得APIは作成しない。

### 3.6 タスク

| HTTP | エンドポイント | 認証 | 用途 |
| --- | --- | --- | --- |
| GET | `/api/v1/tasks` | 必要 | タスク一覧 |
| POST | `/api/v1/applications/:application_id/tasks` | 必要 | タスク登録 |
| PATCH | `/api/v1/tasks/:id` | 必要 | タスク更新・完了状態変更 |
| DELETE | `/api/v1/tasks/:id` | 必要 | タスク削除 |

タスク単独の詳細取得APIは作成しない。

### 3.7 メモ

| HTTP | エンドポイント | 認証 | 用途 |
| --- | --- | --- | --- |
| GET | `/api/v1/applications/:application_id/notes` | 必要 | 応募別メモ一覧 |
| POST | `/api/v1/applications/:application_id/notes` | 必要 | メモ登録 |
| PATCH | `/api/v1/notes/:id` | 必要 | メモ更新 |
| DELETE | `/api/v1/notes/:id` | 必要 | メモ削除 |

メモ単独の詳細取得APIは作成しない。

---

## 4. 認証API

### 4.1 ユーザー登録

```http
POST /api/v1/auth
```

リクエスト:

```json
{
  "user": {
    "name": "山田 太郎",
    "email": "taro@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }
}
```

成功: `201 Created`

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

```json
{
  "data": {
    "id": 1,
    "name": "山田 太郎",
    "email": "taro@example.com"
  }
}
```

失敗:

- `422 Unprocessable Entity`: 入力不備、メールアドレス重複

### 4.2 ログイン

```http
POST /api/v1/auth/sign_in
```

リクエスト:

```json
{
  "user": {
    "email": "taro@example.com",
    "password": "password123"
  }
}
```

成功: `200 OK`

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

```json
{
  "data": {
    "id": 1,
    "name": "山田 太郎",
    "email": "taro@example.com"
  }
}
```

失敗: `401 Unauthorized`

```json
{
  "error": {
    "code": "invalid_credentials",
    "message": "メールアドレスまたはパスワードが正しくありません"
  }
}
```

### 4.3 ログアウト

```http
DELETE /api/v1/auth/sign_out
Authorization: Bearer <JWT>
```

成功: `204 No Content`

JTIMatcherでJWTを失効させる。Reactは成功後に `sessionStorage` のJWTを削除する。

### 4.4 ログインユーザー取得

```http
GET /api/v1/auth/me
Authorization: Bearer <JWT>
```

成功: `200 OK`

```json
{
  "data": {
    "id": 1,
    "name": "山田 太郎",
    "email": "taro@example.com"
  }
}
```

失敗: `401 Unauthorized`

Reactはアプリ初期化時にこのAPIを使用して認証状態を復元する。

---

## 5. 企業API

### 5.1 企業一覧

```http
GET /api/v1/companies
Authorization: Bearer <JWT>
```

成功: `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "name": "株式会社サンプル"
    }
  ]
}
```

既存の求人APIや将来の求人管理画面で利用するため、一覧では `id` と `name` を返す。MVPの簡易応募登録画面ではこのAPIを直接呼ばない。

### 5.2 企業登録

```http
POST /api/v1/companies
Authorization: Bearer <JWT>
```

リクエスト:

```json
{
  "company": {
    "name": "株式会社サンプル",
    "website_url": "https://example.com",
    "industry": "IT",
    "location": "東京都",
    "description": "Webサービスを開発する企業"
  }
}
```

成功: `201 Created`

```json
{
  "data": {
    "id": 1,
    "name": "株式会社サンプル",
    "website_url": "https://example.com",
    "industry": "IT",
    "location": "東京都",
    "description": "Webサービスを開発する企業",
    "created_at": "2026-06-19T06:00:00Z",
    "updated_at": "2026-06-19T06:00:00Z"
  }
}
```

作成された `id` は既存の求人登録APIの `company_id` に使用できる。MVPの簡易応募登録ではRails側が企業を再利用または作成するため、このAPIを個別に呼ばない。

---

## 6. 求人API

### 6.1 求人一覧

```http
GET /api/v1/job_postings
Authorization: Bearer <JWT>
```

成功: `200 OK`

```json
{
  "data": [
    {
      "id": 10,
      "title": "バックエンドエンジニア",
      "employment_type": "正社員",
      "location": "東京都",
      "application_deadline": "2026-07-31",
      "company": {
        "id": 1,
        "name": "株式会社サンプル"
      },
      "application_id": null,
      "created_at": "2026-06-19T06:10:00Z",
      "updated_at": "2026-06-19T06:10:00Z"
    }
  ]
}
```

MVPでは検索とページネーションを行わず、`created_at DESC` で全件返す。

### 6.2 求人登録

```http
POST /api/v1/job_postings
Authorization: Bearer <JWT>
```

リクエスト:

```json
{
  "job_posting": {
    "company_id": 1,
    "title": "バックエンドエンジニア",
    "employment_type": "正社員",
    "location": "東京都",
    "source_url": "https://example.com/jobs/10",
    "description": "Rails APIの開発",
    "application_deadline": "2026-07-31"
  }
}
```

成功: `201 Created`

```json
{
  "data": {
    "id": 10,
    "title": "バックエンドエンジニア",
    "employment_type": "正社員",
    "location": "東京都",
    "source_url": "https://example.com/jobs/10",
    "description": "Rails APIの開発",
    "application_deadline": "2026-07-31",
    "company": {
      "id": 1,
      "name": "株式会社サンプル"
    },
    "created_at": "2026-06-19T06:10:00Z",
    "updated_at": "2026-06-19T06:10:00Z"
  }
}
```

`company_id` は `current_user.companies` から取得する。他ユーザーの企業IDは `404 Not Found` とする。

### 6.3 求人詳細

```http
GET /api/v1/job_postings/10
Authorization: Bearer <JWT>
```

成功: `200 OK`

```json
{
  "data": {
    "id": 10,
    "title": "バックエンドエンジニア",
    "employment_type": "正社員",
    "location": "東京都",
    "source_url": "https://example.com/jobs/10",
    "description": "Rails APIの開発",
    "application_deadline": "2026-07-31",
    "company": {
      "id": 1,
      "name": "株式会社サンプル"
    },
    "application": {
      "id": 20,
      "status": "applied",
      "applied_on": "2026-06-19"
    },
    "created_at": "2026-06-19T06:10:00Z",
    "updated_at": "2026-06-19T06:10:00Z"
  }
}
```

未応募の場合は `application` を `null` とする。

### 6.4 求人更新

```http
PATCH /api/v1/job_postings/10
Authorization: Bearer <JWT>
```

リクエスト:

```json
{
  "job_posting": {
    "location": "東京都渋谷区",
    "application_deadline": "2026-08-15"
  }
}
```

成功: `200 OK`

更新後の求人を `data` に返す。

### 6.5 求人削除

```http
DELETE /api/v1/job_postings/10
Authorization: Bearer <JWT>
```

応募がない場合:

```http
204 No Content
```

応募がある場合: `422 Unprocessable Entity`

```json
{
  "error": {
    "code": "dependent_exists",
    "message": "応募が登録されている求人は削除できません"
  }
}
```

---

## 7. 応募・カンバンAPI

### 7.1 応募一覧

```http
GET /api/v1/applications
Authorization: Bearer <JWT>
```

成功: `200 OK`

```json
{
  "data": [
    {
      "id": 20,
      "status": "applied",
      "applied_on": "2026-06-19",
      "job_posting": {
        "id": 10,
        "title": "バックエンドエンジニア",
        "company": {
          "id": 1,
          "name": "株式会社サンプル"
        }
      },
      "created_at": "2026-06-19T06:20:00Z",
      "updated_at": "2026-06-19T06:20:00Z"
    }
  ]
}
```

MVPでは検索とページネーションを行わない。

### 7.2 応募登録

```http
POST /api/v1/applications
Authorization: Bearer <JWT>
```

リクエスト:

```json
{
  "application": {
    "job_posting_id": 10,
    "status": "applied",
    "applied_on": "2026-06-19"
  }
}
```

成功: `201 Created`

```json
{
  "data": {
    "id": 20,
    "status": "applied",
    "applied_on": "2026-06-19",
    "job_posting": {
      "id": 10,
      "title": "バックエンドエンジニア",
      "company": {
        "id": 1,
        "name": "株式会社サンプル"
      }
    },
    "created_at": "2026-06-19T06:20:00Z",
    "updated_at": "2026-06-19T06:20:00Z"
  }
}
```

同一 `job_posting_id` の重複応募は `422 Unprocessable Entity` とする。MVP画面では後述の簡易応募登録APIを使用する。

### 7.3 応募詳細

```http
GET /api/v1/applications/20
Authorization: Bearer <JWT>
```

成功: `200 OK`

```json
{
  "data": {
    "id": 20,
    "status": "interview_scheduled",
    "applied_on": "2026-06-19",
    "job_posting": {
      "id": 10,
      "title": "バックエンドエンジニア",
      "employment_type": "正社員",
      "location": "東京都",
      "source_url": "https://example.com/jobs/10",
      "application_deadline": "2026-07-31",
      "company": {
        "id": 1,
        "name": "株式会社サンプル"
      }
    },
    "interviews": [],
    "tasks": [],
    "notes": [],
    "created_at": "2026-06-19T06:20:00Z",
    "updated_at": "2026-06-19T06:20:00Z"
  }
}
```

応募詳細画面に必要な関連情報をまとめて返す。各子リソースの単独詳細APIは作成しない。

### 7.4 応募更新

通常の応募更新APIでは `applied_on` のみ変更できる。カンバンのステータス変更には、後述の専用APIを使用する。

```http
PATCH /api/v1/applications/20
Authorization: Bearer <JWT>
```

リクエスト:

```json
{
  "application": {
    "applied_on": "2026-06-20"
  }
}
```

成功: `200 OK`

```json
{
  "data": {
    "id": 20,
    "status": "applied",
    "applied_on": "2026-06-20",
    "updated_at": "2026-06-19T07:00:00Z"
  }
}
```

- 更新時に許可するパラメータは `applied_on` のみとする
- `status` はこのAPIでは変更せず、`PATCH /api/v1/applications/:application_id/status`を使用する

### 7.5 応募削除

```http
DELETE /api/v1/applications/20
Authorization: Bearer <JWT>
```

成功: `204 No Content`

面接、タスク、メモも連鎖削除される。React側で確認ダイアログを表示してから実行する。

### 7.6 カンバン簡易応募登録

```http
POST /api/v1/kanban/applications
Authorization: Bearer <JWT>
```

リクエスト:

```json
{
  "application": {
    "company_name": "  株式会社サンプル  ",
    "application_deadline": "2026-07-31"
  }
}
```

成功: `201 Created`

```json
{
  "data": {
    "id": 20,
    "status": "applied",
    "applied_on": "2026-06-22",
    "company": {
      "id": 1,
      "name": "株式会社サンプル"
    },
    "job_posting": {
      "id": 10,
      "title": "株式会社サンプル",
      "application_deadline": "2026-07-31"
    },
    "updated_at": "2026-06-22T06:20:00Z"
  }
}
```

- 認証済みの `current_user` のデータとして作成する
- `company_name` は前後空白を除去し、必須・最大255文字とする
- `application_deadline` は任意で、指定時は `YYYY-MM-DD` 形式とする
- 同じユーザー内に同名Companyが存在する場合は再利用する
- 同じユーザー内に同一会社名のApplicationが存在する場合は作成せず、`company_name` のバリデーションエラーとして `422 Unprocessable Entity` を返す
- Company、JobPosting、Applicationは `ApplicationRecord.transaction` 内で作成する
- 同一ユーザーの同時リクエストはユーザー行をロックして直列化する
- JobPostingは内部データとして、`title` に会社名、`application_deadline` に入力値を保存する
- Applicationは `status: applied`、`applied_on: Date.current` で作成する
- 途中で失敗した場合はトランザクションをロールバックし、CompanyやJobPostingだけを残さない
- ReactはこのAPIだけを呼び、企業API・求人API・通常の応募登録APIを個別に呼ばない

重複時の例:

```json
{
  "error": {
    "code": "validation_error",
    "message": "入力内容を確認してください",
    "details": {
      "company_name": [
        "Company nameにはすでに応募が登録されています"
      ]
    }
  }
}
```

### 7.7 カンバン取得

```http
GET /api/v1/kanban
Authorization: Bearer <JWT>
```

成功: `200 OK`

```json
{
  "data": {
    "applied": [
      {
        "id": 20,
        "status": "applied",
        "applied_on": "2026-06-19",
        "company": {
          "id": 1,
          "name": "株式会社サンプル"
        },
        "job_posting": {
          "id": 10,
          "title": "株式会社サンプル",
          "application_deadline": "2026-07-31"
        },
        "updated_at": "2026-06-19T06:20:00Z"
      }
    ],
    "document_screening": [],
    "interview_scheduled": [],
    "offered": [],
    "rejected": []
  }
}
```

- `applied`、`document_screening`、`interview_scheduled`、`offered`、`rejected`の5列を必ず返す
- 応募が存在しない列は空配列を返す
- 各列は `updated_at DESC`、同時刻の場合は `id DESC` で返す
- カンバンカードには会社、内部求人、応募日、応募期限、ステータスを含める
- MVP画面では会社名、応募期限、ステータスを表示する
- `next_interview`と`next_task`はMVPでは含めない

### 7.8 カンバンのステータス変更

```http
PATCH /api/v1/applications/20/status
Authorization: Bearer <JWT>
```

リクエスト:

```json
{
  "application": {
    "status": "document_screening"
  }
}
```

成功: `200 OK`

```json
{
  "data": {
    "id": 20,
    "status": "document_screening",
    "applied_on": "2026-06-19",
    "company": {
      "id": 1,
      "name": "株式会社サンプル"
    },
    "job_posting": {
      "id": 10,
      "title": "株式会社サンプル",
      "application_deadline": "2026-07-31"
    },
    "updated_at": "2026-06-19T07:00:00Z"
  }
}
```

- 更新時に許可するパラメータは `status` のみとする
- `applied_on`や`job_posting_id`など、その他の値は変更しない
- ステータス変更で `updated_at`が更新され、移動先の列の先頭へ表示される
- 同一列内の手動並び替えと表示順保存はMVPでは実装しない

---

## 8. 面接API

### 8.1 面接一覧

```http
GET /api/v1/interviews
Authorization: Bearer <JWT>
```

成功: `200 OK`

```json
{
  "data": [
    {
      "id": 30,
      "interview_type": "first",
      "scheduled_at": "2026-06-25T04:00:00Z",
      "location": null,
      "meeting_url": "https://meet.example.com/abc",
      "status": "scheduled",
      "result": "pending",
      "interviewer": "採用担当者",
      "details": "ポートフォリオを準備",
      "application": {
        "id": 20,
        "job_posting": {
          "id": 10,
          "title": "バックエンドエンジニア",
          "company": {
            "id": 1,
            "name": "株式会社サンプル"
          }
        }
      }
    }
  ]
}
```

検索・ページネーションは行わず、`scheduled_at ASC` で返す。必要な表示切り替えはReact側で行う。

### 8.2 面接登録

```http
POST /api/v1/applications/20/interviews
Authorization: Bearer <JWT>
```

リクエスト:

```json
{
  "interview": {
    "interview_type": "first",
    "scheduled_at": "2026-06-25T04:00:00Z",
    "location": null,
    "meeting_url": "https://meet.example.com/abc",
    "status": "scheduled",
    "result": "pending",
    "interviewer": "採用担当者",
    "details": "ポートフォリオを準備"
  }
}
```

成功: `201 Created`

```json
{
  "data": {
    "id": 30,
    "application_id": 20,
    "interview_type": "first",
    "scheduled_at": "2026-06-25T04:00:00Z",
    "location": null,
    "meeting_url": "https://meet.example.com/abc",
    "status": "scheduled",
    "result": "pending",
    "interviewer": "採用担当者",
    "details": "ポートフォリオを準備"
  }
}
```

面接登録時にApplicationのステータスは変更しない。

### 8.3 面接更新

```http
PATCH /api/v1/interviews/30
Authorization: Bearer <JWT>
```

リクエスト:

```json
{
  "interview": {
    "status": "completed",
    "result": "passed",
    "details": "一次面接通過"
  }
}
```

成功: `200 OK`

更新後の面接を `data` に返す。Applicationのステータスは変更しない。

### 8.4 面接削除

```http
DELETE /api/v1/interviews/30
Authorization: Bearer <JWT>
```

成功: `204 No Content`

---

## 9. タスクAPI

### 9.1 タスク一覧

```http
GET /api/v1/tasks
Authorization: Bearer <JWT>
```

成功: `200 OK`

```json
{
  "data": [
    {
      "id": 40,
      "title": "履歴書を送付",
      "description": "採用担当者宛てに送付する",
      "due_at": "2026-06-21T14:59:00Z",
      "priority": "high",
      "completed_at": null,
      "overdue": false,
      "application": {
        "id": 20,
        "job_posting": {
          "id": 10,
          "title": "バックエンドエンジニア",
          "company": {
            "id": 1,
            "name": "株式会社サンプル"
          }
        }
      }
    }
  ]
}
```

検索・ページネーションは行わない。完了・未完了・期限超過の切り替えはReact側で行う。

`overdue` は `completed_at` と `due_at` からAPI側で算出する。

### 9.2 タスク登録

```http
POST /api/v1/applications/20/tasks
Authorization: Bearer <JWT>
```

リクエスト:

```json
{
  "task": {
    "title": "履歴書を送付",
    "description": "採用担当者宛てに送付する",
    "due_at": "2026-06-21T14:59:00Z",
    "priority": "high"
  }
}
```

成功: `201 Created`

```json
{
  "data": {
    "id": 40,
    "application_id": 20,
    "title": "履歴書を送付",
    "description": "採用担当者宛てに送付する",
    "due_at": "2026-06-21T14:59:00Z",
    "priority": "high",
    "completed_at": null,
    "overdue": false
  }
}
```

### 9.3 タスク更新・完了

```http
PATCH /api/v1/tasks/40
Authorization: Bearer <JWT>
```

完了リクエスト:

```json
{
  "task": {
    "completed": true
  }
}
```

成功: `200 OK`

```json
{
  "data": {
    "id": 40,
    "title": "履歴書を送付",
    "due_at": "2026-06-21T14:59:00Z",
    "priority": "high",
    "completed_at": "2026-06-20T01:00:00Z",
    "overdue": false
  }
}
```

`completed` はAPI用パラメータとする。

- `true`: `completed_at = Time.current`
- `false`: `completed_at = nil`

### 9.4 タスク削除

```http
DELETE /api/v1/tasks/40
Authorization: Bearer <JWT>
```

成功: `204 No Content`

---

## 10. メモAPI

APIではメモ本文を `content` として扱い、DBの `notes.body` へ保存する。

### 10.1 応募別メモ一覧

```http
GET /api/v1/applications/20/notes
Authorization: Bearer <JWT>
```

成功: `200 OK`

```json
{
  "data": [
    {
      "id": 50,
      "application_id": 20,
      "content": "企業研究: 自社プロダクトの成長に注力している。",
      "created_at": "2026-06-19T06:50:00Z",
      "updated_at": "2026-06-19T06:50:00Z"
    }
  ]
}
```

`created_at DESC` で返す。

### 10.2 メモ登録

```http
POST /api/v1/applications/20/notes
Authorization: Bearer <JWT>
```

リクエスト:

```json
{
  "note": {
    "content": "企業研究: 自社プロダクトの成長に注力している。"
  }
}
```

成功: `201 Created`

```json
{
  "data": {
    "id": 50,
    "application_id": 20,
    "content": "企業研究: 自社プロダクトの成長に注力している。",
    "created_at": "2026-06-19T06:50:00Z",
    "updated_at": "2026-06-19T06:50:00Z"
  }
}
```

### 10.3 メモ更新

```http
PATCH /api/v1/notes/50
Authorization: Bearer <JWT>
```

リクエスト:

```json
{
  "note": {
    "content": "企業研究を更新。技術ブログも確認する。"
  }
}
```

成功: `200 OK`

更新後のメモを `data` に返す。

### 10.4 メモ削除

```http
DELETE /api/v1/notes/50
Authorization: Bearer <JWT>
```

成功: `204 No Content`

---

## 11. 子リソースの所有者判定

Interview、Task、Noteは `user_id` を持たないため、Application経由で所有権を確認する。

作成:

```ruby
@application = current_user.applications.find(params[:application_id])
@interview = @application.interviews.build(interview_params)
```

更新・削除:

```ruby
@interview = Interview
  .joins(:application)
  .where(applications: { user_id: current_user.id })
  .find(params[:id])
```

TaskとNoteも同じ方式とする。各コントローラーで `before_action` を使用して対象取得を共通化する。

---

## 12. ステータスコード

| ステータス | 使用場面 |
| --- | --- |
| `200 OK` | 取得、更新、ログイン成功 |
| `201 Created` | リソース作成成功 |
| `204 No Content` | 削除、ログアウト成功 |
| `400 Bad Request` | JSON形式不正、ルートキー不足 |
| `401 Unauthorized` | JWTなし、無効、期限切れ、ログイン失敗 |
| `404 Not Found` | 対象なし、他ユーザー所有の対象 |
| `422 Unprocessable Entity` | バリデーションエラー、子データによる削除拒否 |
| `500 Internal Server Error` | 想定外のサーバーエラー |

`409 Conflict` と `429 Too Many Requests` はMVPでは使用しない。

### エラーコード

| code | HTTP | 用途 |
| --- | --- | --- |
| `bad_request` | 400 | リクエスト形式不正 |
| `unauthorized` | 401 | 認証が必要 |
| `invalid_credentials` | 401 | ログイン情報不正 |
| `not_found` | 404 | 対象なし |
| `validation_error` | 422 | 入力値不正 |
| `dependent_exists` | 422 | 子データがあるため削除拒否 |
| `internal_server_error` | 500 | サーバー内部エラー |

---

## 13. 認証が必要なAPI

### 認証不要

- `POST /api/v1/auth`
- `POST /api/v1/auth/sign_in`
- Railsヘルスチェック

### JWT認証必須

- `DELETE /api/v1/auth/sign_out`
- `GET /api/v1/auth/me`
- 企業API
- 求人API
- 応募API
- カンバン取得・簡易応募登録・ステータス変更API
- 面接API
- タスクAPI
- メモAPI

業務APIの基底コントローラーで次を実行する。

```ruby
before_action :authenticate_user!
```

---

## 14. MVP後に実装するAPI・機能

- パスワード再設定
- アカウント情報更新
- アカウント削除
- 企業詳細
- 企業更新
- 企業削除
- Interview、Task、Noteの単独詳細取得
- 検索・フィルターAPI
- ページネーション
- 給与情報
- カンバン同一列内並び替え
- カンバン表示順一括更新
- 次回面接・次回タスクを含むカンバンレスポンス
- `409 Conflict` を使用する競合制御
- `429 Too Many Requests` を使用するレート制限
- 統計・ダッシュボード
- ファイル、通知、カレンダー、タグ、CSV関連API

---

## 15. Railsルーティング案

```ruby
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      devise_for :users, skip: :all

      devise_scope :user do
        post "auth", to: "auth/registrations#create"
        post "auth/sign_in", to: "auth/sessions#create"
        delete "auth/sign_out", to: "auth/sessions#destroy"
        get "auth/me", to: "auth/sessions#show"
      end

      resources :companies, only: %i[index create]
      resources :job_postings

      resources :applications do
        resources :interviews, only: :create
        resources :tasks, only: :create
        resources :notes, only: %i[index create]
      end

      resources :interviews, only: %i[index update destroy]
      resources :tasks, only: %i[index update destroy]
      resources :notes, only: %i[update destroy]
      resource :kanban, only: :show, controller: "kanban"
      post "kanban/applications",
           to: "kanban_applications#create",
           as: :kanban_applications
      patch "applications/:application_id/status",
            to: "application_statuses#update",
            as: :application_status
    end
  end
end
```

---

## 16. React SPA連携

- JWTの保存先は `sessionStorage`
- APIクライアントでJWT付与処理を共通化する
- アプリ初期化時に `/auth/me` を呼ぶ
- `401` を受けた場合はJWTを削除してログイン画面へ遷移する
- カンバン移動は楽観的更新を行い、失敗時に元の列へ戻す
- カンバンの＋ボタンは `POST /api/v1/kanban/applications` のみを呼ぶ
- 簡易応募登録成功時はレスポンスのカードを「応募済み」列へ追加する
- 簡易応募登録失敗時は `company_name` と `application_deadline` のエラーを対応する入力欄へ表示する
- 応募削除前に面接、タスク、メモも削除されることを表示する
- 求人削除が `dependent_exists` で失敗した場合は応募削除が必要であることを表示する
- enumはTypeScriptのunion型で定義する
- レスポンス型に `any` を使用しない
- 日時は表示時に利用者のタイムゾーンへ変換する

```typescript
export type ApplicationStatus =
  | "applied"
  | "document_screening"
  | "interview_scheduled"
  | "offered"
  | "rejected";
```

---

## 17. パフォーマンス・セキュリティ

- 一覧APIは `current_user` でスコープする
- 求人一覧はCompanyとApplicationを事前読み込みする
- 応募一覧はJobPostingとCompanyを事前読み込みする
- 応募詳細はInterview、Task、Noteを事前読み込みする
- 面接・タスク一覧はApplication、JobPosting、Companyを事前読み込みする
- MVPでは全件取得とし、実データ量を確認後にページネーションを追加する
- JWT、パスワード、JTIをログへ出力しない
- CORSにワイルドカードを使用しない
- ユーザー入力をHTMLとして直接描画しない
- 例外のスタックトレースを本番レスポンスへ含めない
