# Deploying ACity Sports to Vercel (GitHub route)

The app is a standard Next.js 15 project — Vercel auto-detects everything.
`.env.local` is gitignored, so no secrets are pushed.

## 1. Create a GitHub repo
Go to https://github.com/new and create an **empty** repo named `acity-sports-app`
(no README, no .gitignore, no license — the project already has them).

## 2. Push this project
In this folder run (replace `<you>` with your GitHub username):

```bash
git remote add origin https://github.com/<you>/acity-sports-app.git
git push -u origin master
```

(The first push opens a browser/credential prompt to sign in to GitHub.)

## 3. Import on Vercel
1. Go to https://vercel.com/new and sign in with GitHub.
2. **Import** the `acity-sports-app` repo.
3. Framework preset: **Next.js** (auto-detected). Leave build settings default.
4. Before clicking Deploy, expand **Environment Variables** and add the three
   below (get the values from your local `.env.local`):

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon (public) key |
   | `NEXT_PUBLIC_SITE_URL` | leave blank for now, or set after step 5 |

5. Click **Deploy**. You'll get a public `https://acity-sports-app-xxxx.vercel.app` URL.

## 4. After first deploy
- Copy the live URL and set `NEXT_PUBLIC_SITE_URL` to it in
  **Vercel → Project → Settings → Environment Variables**, then redeploy
  (only matters once login/auth is re-enabled).
- In **Supabase → Authentication → URL Configuration**, add the Vercel URL to
  the allowed redirect/site URLs (for when auth is turned on later).

## 5. Future updates
Every `git push` to `master` auto-deploys. No extra steps.

## Notes
- The Supabase **anon key is safe to expose** — it's the public client key and
  Row-Level Security protects the data. Do not put the *service_role* key in any
  `NEXT_PUBLIC_` variable.
- The service worker only activates in production, so PWA "Install app" works on
  the live Vercel URL.
