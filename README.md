# Ashutosh Verma — Portfolio

A static personal site written in HTML, CSS, and vanilla JS. It has no build step and no dependencies.

## Run locally

```bash
npx serve .        # or: python3 -m http.server 3000
```

## Deploy to Vercel

You can deploy with the CLI:

```bash
npx vercel          # preview deployment
npx vercel --prod   # production deployment
```

Or deploy from Git. Push this folder to a GitHub repo, then go to vercel.com/new and import it.
Set **Framework Preset** to "Other" and leave the build command empty.

## Edit

- Content: `index.html`
- Theme colors: the CSS variables at the top of `styles.css` (`--accent` sets the highlight color)
- Résumé download: `assets/Ashutosh_Verma_Resume.pdf`
