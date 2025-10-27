# 出退勤打刻アプリ

スマートフォンからワンタップで出退勤を打刻し、管理者のLINEグループに自動通知するPWAアプリです。

## 📱 機能

- **出勤打刻**: ボタン押下でLINEグループに通知、スプレッドシートに記録
- **退勤打刻**: 勤務時間を自動計算、LINEグループに通知
- **課題完了報告**: アプリURLを管理者に自動送信
- **PWA対応**: スマホのホーム画面に追加可能、アプリのように動作
- **リアルタイム更新**: 現在時刻と打刻状況を表示
- **エラーハンドリング**: わかりやすいエラーメッセージ

## 🚀 セットアップ手順

### 1. Google Spreadsheetの作成

1. [Google Spreadsheet](https://sheets.google.com/)で新しいスプレッドシートを作成
2. 以下の3つのシートを作成:

#### シート1: 研修生マスタ
| 研修生ID | 氏名 | ステータス |
|---------|------|-----------|
| user01  | あなたの名前 | 進行中 |

#### シート2: 打刻記録
| 日付 | 研修生ID | 氏名 | 出勤時刻 | 退勤時刻 | 勤務時間 |
|------|---------|------|---------|---------|---------|

#### シート3: 課題完了記録
| 完了日時 | 研修生ID | 氏名 | アプリURL | 判定 |
|---------|---------|------|----------|------|

### 2. Google Apps Scriptの設定

1. スプレッドシートで「拡張機能」→「Apps Script」をクリック
2. `Code.gs`の内容をコピー&ペースト
3. スクリプトエディタで実行を選択し、`setupSpreadsheet`を実行（初回のみ）
4. 「デプロイ」→「新しいデプロイ」をクリック
5. 「種類の選択」で「ウェブアプリ」を選択
6. 設定:
   - 説明: 出退勤打刻API
   - 次のユーザーとして実行: 自分
   - アクセスできるユーザー: 全員
7. 「デプロイ」をクリックし、ウェブアプリURLをコピー

### 3. LINE Messaging APIの設定

LINE Messaging APIは既に設定済みです:
- チャネルアクセストークン: 設定済み
- グループID: 設定済み

### 4. アプリの設定

1. `app.js`を開く
2. `CONFIG`オブジェクトを編集:

```javascript
const CONFIG = {
    GAS_URL: 'YOUR_GAS_WEB_APP_URL_HERE', // 手順2でコピーしたURL
    USER_ID: 'user01',
    APP_URL: 'https://YOUR_GITHUB_USERNAME.github.io/attendance-app' // デプロイ後のURL
};
```

### 5. GitHub Pagesでデプロイ

1. GitHubで新しいリポジトリを作成（例: `attendance-app`）
2. ローカルでコミット:

```bash
git add .
git commit -m "Initial commit: 出退勤打刻アプリ"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/attendance-app.git
git push -u origin main
```

3. GitHubリポジトリの「Settings」→「Pages」に移動
4. Source を「main」ブランチに設定
5. 保存後、`https://YOUR_USERNAME.github.io/attendance-app`にアクセス可能

### 6. スマホにインストール

#### iOS (Safari)
1. Safariでアプリを開く
2. 共有ボタンをタップ
3. 「ホーム画面に追加」を選択

#### Android (Chrome)
1. Chromeでアプリを開く
2. メニュー（⋮）をタップ
3. 「ホーム画面に追加」を選択

## 📝 使い方

1. **出勤時**: アプリを開き「出勤」ボタンをタップ
2. **退勤時**: 「退勤」ボタンをタップ（勤務時間が自動計算されます）
3. **課題完了時**: 「🎉課題完了報告」ボタンをタップ

## 🎯 合格基準チェックリスト

### 必須機能
- [ ] 出勤ボタンでLINE通知が届く
- [ ] 退勤ボタンで勤務時間が計算される
- [ ] スプレッドシートに正しく記録される
- [ ] 課題完了ボタンで管理者に通知が届く
- [ ] PWAとしてスマホにインストールできる

### 加点ポイント
- [x] レスポンシブデザイン
- [x] グラデーションを使った美しいUI
- [x] ローディング表示
- [x] トースト通知
- [x] エラーハンドリング
- [x] リアルタイム時計
- [x] 本日の記録表示
- [x] コードのコメント

## 🛠️ 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (Vanilla)
- **バックエンド**: Google Apps Script
- **通知**: LINE Messaging API
- **データベース**: Google Spreadsheet
- **ホスティング**: GitHub Pages
- **PWA**: Service Worker, Web App Manifest

## 📂 ファイル構成

```
attendance-app/
├── index.html          # メインHTML
├── styles.css          # スタイルシート
├── app.js              # アプリケーションロジック
├── manifest.json       # PWAマニフェスト
├── sw.js               # Service Worker
├── icon-192.png        # PWAアイコン (192x192)
├── icon-512.png        # PWAアイコン (512x512)
├── Code.gs             # Google Apps Script
├── create-icons.html   # アイコン生成ツール
└── README.md           # このファイル
```

## 🔧 トラブルシューティング

### アプリが動作しない
- `app.js`の`GAS_URL`が正しく設定されているか確認
- GASのデプロイが「全員」にアクセス許可されているか確認
- ブラウザの開発者コンソールでエラーを確認

### LINE通知が届かない
- LINEチャネルアクセストークンが正しいか確認
- グループIDが正しいか確認
- GASのログでエラーを確認

### スプレッドシートに記録されない
- GASの権限が正しく設定されているか確認
- `setupSpreadsheet`関数を実行したか確認

## 📄 ライセンス

MIT License

## 👤 作成者

研修生 - 課題5: 出退勤打刻アプリ

## 🎉 課題完了

アプリ内の「🎉課題完了報告」ボタンを押して、管理者に通知してください！
