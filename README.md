<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# hawa — Glass Digital Audio Workstation 🐇

**hawa** is an innovative glass-transparent Digital Audio Workstation inspired by Logic Pro featuring 3D spatial acoustics (Three.js), built-in synthesizers, an 808/909 drum machine, an interactive piano roll, a harmonic chord assistant, and beginner-friendly composition tools.

---

## 🚀 GitHub Pages Deployment

This repository (`hawasoftware/hawasoftware.github.io`) is fully configured for automated GitHub Pages hosting.

### Method A: Automated GitHub Actions (Recommended)
1. Go to your repository on GitHub: `https://github.com/hawasoftware/hawasoftware.github.io`
2. Go to **Settings** > **Pages** (under "Code and automation" in the left sidebar).
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. Push your changes to `main` or `master`. The workflow in `.github/workflows/deploy.yml` will automatically build the site and deploy it to `https://hawasoftware.github.io/`.

### Method B: Manual Static Build
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. The compiled assets will be output to the `dist/` directory.

---

## 💻 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.

