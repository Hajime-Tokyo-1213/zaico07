# 在庫可視化ツール

ZaicoとGoogleスプレッドシートからデータを集約し、取引の進捗状況を可視化するWebアプリケーション

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env.example`を`.env`にコピーして、必要な情報を入力：

```bash
cp .env.example .env
```

以下の環境変数を設定：
- `ZAICO_API_TOKEN`: Zaico APIのアクセストークン
- `GOOGLE_APPLICATION_CREDENTIALS`: Google Sheetsサービスアカウントキーファイルのパス
- `PORT`: サーバーポート（デフォルト: 3000）

### 3. Google Sheetsサービスアカウントの設定
1. Google Cloud Consoleでサービスアカウントを作成
2. JSONキーファイルをダウンロード
3. キーファイルを安全な場所に配置し、`GOOGLE_APPLICATION_CREDENTIALS`にパスを設定
4. 対象のGoogleスプレッドシートにサービスアカウントのメールアドレスを閲覧権限で共有

## 起動方法

### 開発環境
```bash
npm run dev
```

### 本番環境
```bash
npm start
```

## アクセス
- ダッシュボード: http://localhost:3000/
- 取引履歴: http://localhost:3000/history

## 機能
- 未完了取引の表示（国内取引・直接取引）
- 完了済み取引の履歴表示
- Zaico在庫データの表示
- データの自動更新（5分間キャッシュ）
- 手動データ更新機能