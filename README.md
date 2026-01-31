
# Five Pillars of Islam (PWA)

Tabbed “Five Pillars of Islam” app with a Zakat calculator.

- Mobile + web friendly (responsive)
- Anonymous (no login)
- Offline-capable (PWA caching after first visit)
- Remembers tab + zakat inputs (localStorage)

## Run locally
1) Install Node.js (18+ recommended)
2) Install dependencies:
   npm install
3) Start dev server:
   npm run dev
4) Open:
   http://localhost:3000

## Deploy with GitHub + Vercel
### Option A — GitHub browser only (no terminal)
1) Create a GitHub repo
2) Add all files from this project (Add file → Create new file)
3) Upload icons to /public:
   - icon-192.png
   - icon-512.png
4) Go to Vercel
5) New Project → Import Git Repository
6) Framework: Next.js (auto-detected)
7) Deploy

### Option B — Local + push
1) Create Next project folder and paste code
2) git init
3) git add .
4) git commit -m "Initial commit"
5) git remote add origin <your-repo-url>
6) git push -u origin main
7) Import repo on Vercel and deploy

## Offline behavior
- Users can use the app without installing: just open the Vercel URL.
- Offline works AFTER the first successful online visit (so files can be cached).
- Installing improves offline reliability and provides a home screen icon.

## Customize
- Change theme colors in tailwind.config.js
- Update default gold/silver prices in lib/zakat.ts
- Change default tab in app/page.tsx:
  usePersistedState(..., "salah") → "zakat"
