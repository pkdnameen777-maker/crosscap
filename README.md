# CrossCap — UAE-First Wealth OS

Premium static website + app flow for CrossCap.

## Pages

| File | Description |
|------|-------------|
| `index.html` | Marketing landing page |
| `login.html` | Sign-in / Continue with Google |
| `dashboard.html` | Full wealth dashboard (all modules) |

## User flow

1. **Landing** → click **Launch App** or **Book Demo**
2. **Login** → **Continue with Google** (or email) → enters Dashboard
3. **Dashboard** modules:
   - Overview (Net Worth, Cash Flow, 30-Day Outflow Radar, Golden Visa)
   - Portfolio (stocks table)
   - Add Asset (Stocks & ETFs, Real Estate, Crypto, Gold)
   - Real Estate (Ready + Off-Plan forms with installment schedule + reminder engine)
   - AI Insights
   - Cash Flow
   - Goals
   - Reports
   - Settings

## Design

- Font: San Francisco (SF Pro) system stack
- Primary: white surfaces
- Accent: purple brand scale
- Fully responsive

## Deploy to Vercel

```bash
cd crosscap-website
git init
git add .
git commit -m "CrossCap full flow"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/crosscap-website.git
git push -u origin main
```

Then import the repo on vercel.com.

Or drag the folder into Vercel / Netlify.

## Local preview

Open `index.html` in a browser, or:

```bash
npx serve .
```

Then visit:
- `/` → Landing
- `/login.html` → Auth
- `/dashboard.html` → App
