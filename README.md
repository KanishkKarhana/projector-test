# Product Testing Portal

GitHub Pages structure:

- `/` — Product Testing Portal
- `/projector/` — Projector menu
- `/projector/new-testing/` — New Projector Testing Report
- `/projector/pre-dispatch/` — Projector Pre-Dispatch Inspection

This is a static website. Each report builder generates its DOCX locally in the browser.

## GitHub Pages

Upload the contents of this folder to the root of a GitHub repository, then enable Pages from `main` / `(root)`.

The child builders load their own `template.docx` using a relative URL, so keep each template beside its corresponding `index.html` and `app.js`.
