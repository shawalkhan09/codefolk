# Agency site

Marketing site for a small software agency (Peshawar and remote). Static, built with [Astro](https://astro.build) and plain CSS.

Pages: Home, Restaurants, Work, case study (`/work/<slug>/`), About, Contact, Privacy.

## Run

```bash
npm install
npm run dev        # http://localhost:4321
```

## Build

| Command | What it does |
| --- | --- |
| `npm run build` | Production build. Only projects with `permission: "cleared"` are published. Warns about leftover placeholders. |
| `npm run build:prod` | Same, but fails while any placeholder is left or `PUBLIC_FORM_ENDPOINT` / `SITE_URL` is unset. |
| `npm run build:preview` | Includes draft projects so the full design can be reviewed. |
| `npm run preview` | Serves `dist/`. |

Output goes to `dist/` and can be deployed to any static host.

## Content

- `src/site.ts`: agency name, year, WhatsApp, Instagram, privacy contact, team members and links.
- `src/data/projects.json`: one entry per project; each one gets a case study page. See `src/data/README.md` for the fields.
- Page copy lives in `src/pages/`. Anything in `[square brackets]` renders as a yellow placeholder and is reported by `scripts/check-placeholders.mjs`.

## Environment variables

Copy `.env.example` to `.env`.

| Variable | Purpose |
| --- | --- |
| `PUBLIC_FORM_ENDPOINT` | URL that receives contact form submissions (Formspree, Web3Forms or similar) and forwards them to the team. |
| `SITE_URL` | Final domain, used for the sitemap and canonical URLs. |

## Tests

```bash
npm test             # layout audit at 16 sizes plus behaviour checks (menu, loader, filters, form)
npm run lighthouse   # mobile Lighthouse run for every page
```

Playwright needs a browser once: `npx playwright install chromium`.
