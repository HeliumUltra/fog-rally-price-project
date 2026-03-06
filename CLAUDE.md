# FOG Rally 2026 — Pricing Scenarios

## Project
React + Vite single-page app for modeling FOG Rally registration pricing scenarios.

## Tech Stack
- React 19, Vite 7, JavaScript (JSX)
- All app logic is in `src/App.jsx`
- Inline CSS-in-JS styling (no CSS files)
- Fonts: Barlow (headings), Poppins (body) via Google Fonts

## Dev Server
```
npm run dev      # Vite dev server on port 5173
npm run build    # Production build to /dist
```

## Deploy
- **GitHub:** https://github.com/HeliumUltra/fog-rally-price-project
- **Netlify:** https://prismatic-hummingbird-9b95b8.netlify.app
- **Netlify site ID:** e3640a57-ae8a-408b-9b61-ddc82e5c04cf
- **Auto-deploy:** Enabled — pushing to `main` triggers Netlify build
- **Build command:** `npm run build`
- **Publish directory:** `dist`

### To deploy changes:
1. Commit and push to `main` — Netlify auto-deploys
2. Or run `/deploy` for the full automated workflow
