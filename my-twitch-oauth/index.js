// index.js
const express = require('express');
const fetch = require('node-fetch'); // Node.js v18未満の場合。v18以降はグローバルfetchが使えます
const app = express();

const PORT = process.env.PORT || 3000;

// 環境変数から設定値を取得
const CLIENT_ID = process.env.CLIENT_ID;           // Twitch Developer Dashboardで取得したClient ID
const CLIENT_SECRET = process.env.CLIENT_SECRET;     // Twitch Developer Dashboardで取得したClient Secret
const REDIRECT_URI = process.env.REDIRECT_URI;       // 例: https://your-app.onrender.com/oauth/callback

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.error("CLIENT_ID, CLIENT_SECRET, REDIRECT_URI は必須です。");
  process.exit(1);
}

// ルートページ（動作確認用）
app.get('/', (req, res) => {
  res.send('Twitch OAuth Server is running.');
});

// /auth エンドポイント：Twitchの認証ページへリダイレクト
app.get('/auth', (req, res) => {
  const scope = 'user:read:email'; // 必要に応じてスコープを変更
  const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scope)}`;
  console.log("Redirecting to Twitch Auth URL:", twitchAuthUrl);
  res.redirect(twitchAuthUrl);
});

// /oauth/callback エンドポイント：Twitchからのリダイレクトを受け、コードをアクセストークンに交換
app.get('/oauth/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('No code provided');
  }
  console.log("Received code:", code);

  const tokenUrl = `https://id.twitch.tv/oauth2/token`;
  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('code', code);
  params.append('grant_type', 'authorization_code');
  params.append('redirect_uri', REDIRECT_URI);

  try {
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      body: params
    });
    const tokenData = await tokenResponse.json();
    console.log("Token Data:", tokenData);
    // 実際の運用ではここでトークン情報をデータベースに保存するなどの処理を行います。
    res.json(tokenData);
  } catch (error) {
    console.error("Token exchange error:", error);
    res.status(500).send('Token exchange failed');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
