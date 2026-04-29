# Personal Library — Web App

The mobile/web version of Personal Library. Runs in any browser, syncs via GitHub.

## Live URL (after deploy)
`https://YOUR_GITHUB_USERNAME.github.io/my-library`

## Setup

```bash
npm install
```

**Edit `package.json`** — change the `homepage` field to your actual GitHub Pages URL:
```json
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/my-library"
```

## Run locally
```bash
npm start
```

## Deploy to GitHub Pages (auto)

This repo has a GitHub Actions workflow (`.github/workflows/deploy.yml`).
Every push to `main` automatically builds and deploys the app.

**One-time GitHub setup:**
1. Push this folder as a repo called `my-library` on GitHub
2. Go to **Settings → Pages → Source → GitHub Actions**
3. Done — the next push will deploy it

## Manual deploy
```bash
npm run deploy
```

## First use
Open the deployed URL on your phone, tap **Add to Home Screen** for an app-like experience.
Go to **Sync** and enter the same GitHub token + repo you used in the desktop app.
