# CrossCap — UAE-First Wealth OS Landing Page

Premium marketing site for **CrossCap**, the AED-native wealth operating system for global expats and investors in the UAE.

## Features

- Clean white-primary design with refined purple (brand) accent palette
- Fully responsive (mobile → desktop)
- Interactive dashboard mockup reflecting the product (net worth, cash flow, 30-day outflow radar, off-plan installments, Golden Visa progress)
- Sections covering:
  - Hero with dual CTAs (Launch App / Book Demo)
  - Multi-asset AED dashboard
  - Off-plan real estate radar + installment table
  - Passive income & dividend tracking
  - 3-step How it Works
  - Liquid assets (stocks / gold / crypto) teaser

## Tech

- Pure HTML + Tailwind CSS (CDN) + minimal vanilla JS
- No build step required
- Optimized for Vercel / Netlify / GitHub Pages

## Deploy to Vercel

### Option A — GitHub + Vercel (recommended)

1. Create a new repository on GitHub
2. Push this folder:

```bash
cd crosscap-website
git init
git add .
git commit -m "Initial CrossCap landing page"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/crosscap-website.git
git push -u origin main
```

3. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import the GitHub repo
4. Framework Preset: **Other** (or leave blank)
5. Click **Deploy**

Your site will be live at `https://your-project.vercel.app`

### Option B — Vercel CLI

```bash
npm i -g vercel
cd crosscap-website
vercel
```

## Local preview

Just open `index.html` in a browser, or run a simple static server:

```bash
npx serve .
# or
python3 -m http.server 3000
```

## Customization

- Brand colors are defined in the Tailwind config inside `<script>` in `index.html` (`brand-50` → `brand-950`)
- Replace `mailto:hello@crosscap.ae` and CTA links with your real app / Calendly URLs
- Favicon and Open Graph tags can be added in `<head>` as needed

---

Built for the CrossCap startup · 2026
