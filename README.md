# Markdown to DOCX/PDF Converter

A production-ready React web app that converts Markdown content into downloadable **DOCX** and **PDF** files directly in the browser.

## Features

- Live Markdown editor and preview
- Export Markdown to `.docx`
- Export Markdown to `.pdf`
- Client-side processing (no backend required)
- Sanitized preview rendering with DOMPurify

## Tech Stack

- React + Vite
- `marked` for Markdown parsing
- `docx` + `file-saver` for DOCX generation and download
- `jspdf` for PDF generation
- `oxlint` for linting

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Quality checks

```bash
npm run check
```

## Publish with GitHub Actions

- The repository includes `.github/workflows/publish.yml` to build and deploy to GitHub Pages.
- Deploy runs automatically on pushes to `main` and can also be started manually from the Actions tab.
- In repository settings, set **Pages** source to **GitHub Actions**.
- The workflow runs `npm run check`, builds the app, and publishes the `dist` output.

## Publish Standard Notes

- Uses a production build pipeline (`vite build`)
- Includes lint + build check command (`npm run check`)
- Includes MIT license for open distribution
- Uses secure HTML sanitization in preview rendering

## License

MIT
