# 在庫可視化ツール 要件定義書 Rev.1 (2025/07/09)

## 1. 目的

本システムは、複数のGoogleスプレッドシートおよび在庫管理サービス「Zaico」からデータを集約し、取引の進捗状況（未完了・完了）を可視化することを目的とする。
従来のWebスクレイピングによるデータ取得を廃止し、Zaico公式APIを利用することで、安定的かつ正確なデータ連携を実現する。

## 2. システム構成

*   **バックエンド:** Node.js / Express
*   **フロントエンド:** HTML, CSS, JavaScript (静的ファイル)
*   **データソース:** Google Sheets API, Zaico API

## 3. データソース仕様

システムのデータは以下のAPIから取得する。

### 3.1. Zaico API

*   **ドキュメント:** [Zaico API Document](https://zaicodev.github.io/zaico_api_doc/)
*   **取得対象:** 在庫データ
*   **エンドポイント:** `GET https://web.zaico.co.jp/api/v1/inventories`
*   **認証方法:** Bearerトークン認証
    *   HTTPヘッダーに `Authorization: Bearer <API_TOKEN>` を付与する。
*   **必要な環境変数:** `ZAICO_API_TOKEN` (Zaicoから発行されたアクセストークン)
*   **特記事項:**
    *   APIはページネーションを実装しているため、`Link`ヘッダーを解釈し、全ページのデータを取得する必要がある。

### 3.2. Googleスプレッドシート

認証にはサービスアカウントキー(JSONファイル)を使用する。
*   **必要な環境変数:** `GOOGLE_APPLICATION_CREDENTIALS` (認証JSONファイルのパス)

#### 3.2.1. 入受出荷管理シート

*   **シート名:** `入受出荷管理`
*   **スプレッドシートID:** `12Z57k2YC-URoSP-kA3Y5qozE5yIe5We8LP5qUiNKEv0`
*   **URL:** [https://docs.google.com/spreadsheets/d/12Z57k2YC-URoSP-kA3Y5qozE5yIe5We8LP5qUiNKEv0/](https://docs.google.com/spreadsheets/d/12Z57k2YC-URoSP-kA3Y5qozE5yIe5We8LP5qUiNKEv0/)
*   **取得対象シートと範囲:**
    *   `ebay用仕入れ!A:L`
    *   `スイッチライト!A:L`
    *   `スイッチタブレット!A:L`
*   **データマッピング:** (列 -> データ項目)
    *   `B`: `managementNumber` (管理番号)
    *   `C`: `supplier` (仕入先)
    *   `D`: `productName` (商品名)
    *   `I`: `shipDate` (出荷日)
    *   `L`: `shippedCheck` (出荷チェック)

#### 3.2.2. インボイスシート

*   **シート名:** `インボイス`
*   **スプレッドシートID:** `1yOBlT5PbKGQOILcd0LUqo0_Ql_27g6MbQLb-g5cHVyw`
*   **URL:** [https://docs.google.com/spreadsheets/d/1yOBlT5PbKGQOILcd0LUqo0_Ql_27g6MbQLb-g5cHVyw/](https://docs.google.com/spreadsheets/d/1yOBlT5PbKGQOILcd0LUqo0_Ql_27g6MbQLb-g5cHVyw/)
*   **取得対象シートと範囲:**
    *   `全体!A:H`
*   **データマッピング:**
    *   `B`: `partner` (取引先名)
    *   `C`: `invoiceNumber` (取引番号)
    *   `E`: `productName` (商品名)
    *   `F`: `quantity` (注文数)

#### 3.2.3. 独発送管理シート

*   **シート名:** `独発送管理`
*   **スプレッドシートID:** `133cDct4krrsJDeXpO9l0fIrd3-ZYDc39u6-JpQvcxv4`
*   **URL:** [https://docs.google.com/spreadsheets/d/133cDct4krrsJDeXpO9l0fIrd3-ZYDc39u6-JpQvcxv4/](https://docs.google.com/spreadsheets/d/133cDct4krrsJDeXpO9l0fIrd3-ZYDc39u6-JpQvcxv4/)
*   **取得対象シートと範囲:**
    *   `独発送管理!A:G`
*   **データマッピング:**
    *   `B`: `invoiceNumber` (取引番号)
    *   `G`: `shippedQuantity` (発送済み数)

## 4. 機能要件

### 4.1. データ分類ロジック

取得したデータは「未完了」と「完了済み」に分類する。

*   **未完了取引の定義:**
    1.  **国内取引:** 「入受出荷管理」シートのデータで、`出荷日` (I列) が **空欄** 、かつ `出荷チェック` (L列) が **FALSE (または未チェック)** のもの。
    2.  **直接取引:** 「インボイス」シートと「独発送管理」シートを取引番号で紐付け、`発送済み数` (独発送管理-G列) が `注文数` (インボイス-F列) よりも **少ない** もの。

*   **完了済み取引の定義:**
    1.  **国内取引:** 「入受出荷管理」シートのデータで、`出荷日` (I列) に **日付が入力されている** 、または `出荷チェック` (L列) が **TRUE (またはチェック済み)** のもの。
    2.  **直接取引:** `発送済み数` (独発送管理-G列) が `注文数` (インボイス-F列) と **等しいか、それ以上** のもの。

### 4.2. APIエンドポイント

*   `GET /api/dashboard-data`: トップページに必要な未完了取引データをすべて返す。
*   `GET /api/history-data`: 取引履歴ページに必要な完了済み取引データをすべて返す。
*   `POST /api/refresh`: サーバー側のキャッシュをクリアし、すべてのデータを再取得する。

## 5. 画面仕様

*   **トップページ (`index.html`):**
    *   未完了の国内取引と直接取引を一覧表示する。
    *   表示形式はアコーディオンUIを採用する。
*   **取引履歴ページ (`history.html`):**
    *   完了済みの取引を一覧表示する。 