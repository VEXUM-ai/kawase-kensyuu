# クイックスタートガイド ⚡

このアプリを5分で動かすための最短手順です！

---

## 🚀 最短5ステップ

### ステップ1: Google Spreadsheetを作成 (1分)

1. [Google Spreadsheet](https://sheets.google.com/)で新しいスプレッドシートを作成
2. 「拡張機能」→「Apps Script」をクリック

### ステップ2: GASをデプロイ (2分)

1. `Code.gs`の内容をコピー&ペースト
2. `setupSpreadsheet`を実行（権限を許可）
3. 「研修生マスタ」シートの2行目「氏名」に **あなたの名前** を入力
4. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」
   - アクセスできるユーザー: **全員**
5. **ウェブアプリURL** をコピー

### ステップ3: app.jsを設定 (30秒)

```javascript
const CONFIG = {
    GAS_URL: 'ここにウェブアプリURLを貼り付け',
    USER_ID: 'user01',
    APP_URL: 'https://YOUR_USERNAME.github.io/attendance-app' // あとで更新
};
```

### ステップ4: GitHubにプッシュ (1分)

```bash
# まだGitリポジトリを初期化していない場合
git init
git add .
git commit -m "Initial commit"

# GitHubの新しいリポジトリにプッシュ
git remote add origin https://github.com/YOUR_USERNAME/attendance-app.git
git push -u origin main
```

### ステップ5: GitHub Pagesを有効化 (30秒)

1. GitHubリポジトリ → Settings → Pages
2. Branch: `main` → Save
3. 数分待って、デプロイURLにアクセス！

---

## ✅ 動作確認

1. アプリを開く
2. 「出勤」ボタンをクリック
3. LINEグループに通知が届けばOK！🎉

---

## 🎯 課題完了

すべて動いたら「🎉課題完了報告」ボタンを押すだけ！

---

## 📚 詳しい手順

詳細なセットアップ手順は`SETUP_GUIDE.md`を参照してください。

---

頑張ってください！ 💪
