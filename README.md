# Projector Test Report Builder

This is a static browser application built around the supplied Projector Test Report Word template.

## Run / publish

The app needs to be served over HTTP(S) because the browser fetches `template.docx`. The easiest options are GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any normal web server.

Keep these files in the same folder:
- `index.html`
- `styles.css`
- `app.js`
- `template.docx`

Open the hosted `index.html` URL on a phone or laptop.

## What it does

- Collects the general projector information and technical parameters.
- Collects the 9 brightness measurements in a 3×3 grid.
- Calculates average brightness, screen area, ANSI lumens, brightness uniformity and throw ratio live.
- Collects four test-result pass/fail decisions and remarks.
- Accepts the eight physical projector photos plus the test photos used by the supplied template.
- Replaces the template's image files while preserving the template's Word layout, tables, page structure and formatting.
- Generates a `.docx` report directly in the browser; no projector data needs to be uploaded to a server by this app.

## Calculation definitions

ANSI lumens = average of the 9 brightness readings (lux) × screen area (m²).

Uniformity = average of the four corner readings ÷ center reading × 100.

Throw ratio = projector-to-screen distance ÷ screen width.

The website accepts screen dimensions and throw distance in centimetres and converts them to metres where required.

## Important

The supplied Word template is preserved as the report base. The app only replaces marked data fields and the image files. If you later change the Word template's formatting, regenerate the website's `template.docx` with the same placeholder fields.
