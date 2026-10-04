# Trimo

月額サブスクの合計金額を見える化する、ブラウザだけで動くアプリです（GitHub Pages 用ファイル一式）。

## ファイル構成

| ファイル | 役割 |
|---|---|
| `index.html` | アプリ本体 |
| `sw.js` | オフライン対応とプッシュ通知（FCM）受信 |
| `manifest.webmanifest` | ホーム画面に追加するための情報 |
| `apple-touch-icon.png` / `icon-192.png` / `icon-512.png` | アプリアイコン（180 / 192 / 512px） |
| `prices.json` / `services.json` | 価格・サービス一覧の更新用（中身は空でOK） |
| `.nojekyll` | GitHub Pages の Jekyll 処理を無効化 |
| `404.html` / `robots.txt` | 存在しないURLの案内 / 検索エンジン向け |

## 公開手順

1. GitHub で新しいリポジトリを作ります（例: `trimo`、Public）。
2. このフォルダの**中身**をすべてリポジトリのルートにアップロードします（`.nojekyll` も忘れずに）。
3. リポジトリの **Settings → Pages** を開き、Source を **Deploy from a branch**、Branch を **main / (root)** にして Save します。
4. 数分後、`https://<ユーザー名>.github.io/<リポジトリ名>/` で公開されます。

## 公開後に必要な設定（Firebase）

- **Authentication → 設定 → 承認済みドメイン** に `<ユーザー名>.github.io` を追加します。未追加だと、Googleログインが `auth/unauthorized-domain` で失敗します。
- **Firestore のルール**は、本人のデータだけ読み書きできる設定にしてください。

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 任意の仕上げ

- URLが決まったら、`index.html` の `<head>` に次の2行を追加すると、検索結果やSNS共有で正しいURLが使われます。

```html
<link rel="canonical" href="https://<ユーザー名>.github.io/<リポジトリ名>/">
<meta property="og:url" content="https://<ユーザー名>.github.io/<リポジトリ名>/">
```

- 価格やサービスを更新したいときは `prices.json` / `services.json` を編集します。形式は `index.html` 内のコメントを参照してください。
- `sw.js` を変更してキャッシュを入れ替えたいときは、先頭の `CACHE = 'trimo-v1'` の番号を上げます。

## 注意

- `file://` で直接開くとログインやService Workerは動きません。ローカル確認は `npx serve` などで `http://localhost` から開いてください。
- ホーム画面のアイコンは、追加した時点のものが使われます。変更後は一度削除して追加し直してください。
