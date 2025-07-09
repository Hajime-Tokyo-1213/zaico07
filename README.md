# 在庫可視化ツール

Zaicoと複数のGoogleスプレッドシートのデータを統合し、在庫状況を一覧で可視化するための社内向けツールです。

## 主な機能

- 各種スプレッドシート（入受出荷管理、インボイス、発送管理）のデータを集計
- Zaico APIから現在の在庫情報を取得
- 集計したデータを元に、未完了の取引や在庫状況をダッシュボードに表示

---

## 1. ローカル開発環境のセットアップ

このプロジェクトをご自身のPCで動かすための手順です。

### 必要なもの

- [Node.js](https://nodejs.org/ja/) (バージョン 18 以上を推奨)
- [Git](https://git-scm.com/)

### セットアップ手順

1.  **リポジトリをクローン**
    ```bash
    git clone https://github.com/Hajime-Tokyo-1213/zaico07.git
    cd zaicoNote250707
    ```

2.  **必要なパッケージをインストール**
    ```bash
    npm install
    ```

3.  **環境変数ファイルを作成**
    プロジェクトのルートに `.env` という名前のファイルを作成し、以下の内容を貼り付けます。
    値はプロジェクト管理者から安全な方法（チャエンなど）で共有してもらってください。

    ```env
    # Zaico APIのアクセストークン
    ZAICO_API_TOKEN=xxxxxxxxxxxx

    # Google Service AccountのクライアントEmail
    GOOGLE_CLIENT_EMAIL=your-account@your-project.iam.gserviceaccount.com

    # Google Service Accountの秘密鍵
    # -----BEGIN PRIVATE KEY----- から -----END PRIVATE KEY-----\n まで全てを貼り付け
    GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n.....\n-----END PRIVATE KEY-----\n"
    ```

    **【重要】** `.env` ファイルは機密情報を含むため、絶対にGitでコミットしないでください。

4.  **開発サーバーを起動**
    ```bash
    npm start
    ```
    ブラウザで `http://localhost:3000` を開くと、アプリケーションが表示されます。

---

## 2. Vercelへのデプロイについて

このプロジェクトは、GitHubの`main`ブランチにコードがプッシュされると、自動的にVercelにデプロイされるように設定されています。

### 環境変数

Vercel上でアプリケーションを正しく動作させるために、ローカル開発で使ったものと同じ環境変数をVercel側にも設定する必要があります。

1.  Vercelのプロジェクトページにアクセスします。
2.  「Settings」 > 「Environment Variables」を開きます。
3.  `.env`ファイルに設定した`ZAICO_API_TOKEN`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`の3つを、それぞれ同じ名前で登録します。

この設定により、デプロイされたアプリケーションもZaicoとGoogle SheetsのAPIに正しくアクセスできるようになります。