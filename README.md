# Personal Library — Web

A personal book library app synced to GitHub.

## Token setup (two tokens, two purposes)

### 1. Read-only token → Vercel environment variables
This lets anyone with your URL browse the library without you sharing any secrets.

1. Go to https://github.com/settings/tokens?type=beta → Generate new token
2. Name: `library-readonly`
3. Repository access: select your data repo only
4. Permissions: Contents → **Read-only**
5. Copy the token

In Vercel → your project → Settings → Environment Variables, add:
```
REACT_APP_RO_TOKEN = github_pat_...your read-only token...
REACT_APP_RO_REPO  = youruser/your-data-repo
```
Redeploy after setting these.

### 2. Read-write token → Sync Settings page (owner only)
This stays only in your browser's localStorage and is never in the code.

1. Generate a second token with Contents → **Read and write**
2. Open your deployed app → ⚙ Sync Settings → paste token + repo → Save

## Viewer link
Click **☰ Menu → Copy viewer link** to get a `?viewer=1` URL.
Share it freely — it uses the read-only token baked into the build.
Even if someone finds this URL they cannot edit or delete anything.

## Security model
| Token | Lives in | Can do |
|-------|----------|--------|
| Read-only | Vercel env vars → compiled JS | Fetch library.json only |
| Read-write | Your browser localStorage | Fetch + push library.json |

The read-only token is visible in the browser's network tab — that's fine.
It has no write permissions and is scoped to one repo.
