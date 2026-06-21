# JOBHUNTMANAGER

## Project Overview
就職活動を管理するWebアプリ

## Tech Stack
- Ruby on Rails API
- React
- TypeScript
- Tailwind CSS
- PostgreSQL

## Coding Rules
- 日本語で回答する
- RESTfulに実装する
- Strong Parametersを必ず実装する
- before_actionを適切に使用する
- N+1問題を考慮する
- 可読性を重視する
- Reactは関数コンポーネントを使用する
- Tailwind CSSでスタイリングする

## Development Policy
- MVPを優先する
- セキュリティを考慮する
- 保守しやすいコードを書く

## App Concept
- JOBHUNTMANAGERは、就職活動を管理するカンバン式SPAアプリ
- 求人・応募状況・面接予定・タスクをカード形式で管理する
- React側で画面遷移を行い、Rails APIからJSONでデータを取得する
- 応募ステータスはカンバンの列として表示する

## Kanban Status
- 応募済み
- 書類選考中
- 面接予定
- 内定
- 見送り