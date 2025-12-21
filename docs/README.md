# Rewind Documentation

This directory contains the documentation for Rewind, built with [VitePress](https://vitepress.dev/).

## Documentation Files

- `index.md` - Homepage
- `USER_GUIDE.md` - Complete user guide
- `DEVELOPER_GUIDE.md` - Development guide
- `EMAIL_SETUP_GUIDE.md` - Email notification setup
- `screenshots/` - Documentation screenshots

## Development

### Prerequisites

- Bun or Node.js 18+

### Install Dependencies

```bash
bun install
```

### Run Development Server

```bash
bun run dev
```

The documentation site will be available at http://localhost:5173

### Build for Production

```bash
bun run build
```

Output will be in `.vitepress/dist`

### Preview Production Build

```bash
bun run preview
```

## Deployment

### Deploy to GitHub Pages

1. Build the site:
   ```bash
   bun run build
   ```

2. Deploy the `.vitepress/dist` folder to GitHub Pages:
   ```bash
   # Option 1: Using gh-pages (recommended)
   npm install -g gh-pages
   gh-pages -d .vitepress/dist
   
   # Option 2: Manual deployment
   # Push the dist folder to the gh-pages branch
   ```

### Deploy to Vercel

1. Import the repository to Vercel
2. Set build command: `cd docs && bun run build`
3. Set output directory: `docs/.vitepress/dist`
4. Deploy

### Deploy to Netlify

1. Import the repository to Netlify
2. Set build command: `cd docs && bun run build`
3. Set publish directory: `docs/.vitepress/dist`
4. Deploy

### Deploy to Cloudflare Pages

1. Connect your repository to Cloudflare Pages
2. Set build command: `cd docs && bun run build`
3. Set build output directory: `docs/.vitepress/dist`
4. Deploy

## Configuration

The VitePress configuration is in `.vitepress/config.js`. You can customize:

- Site title and description
- Navigation and sidebar
- Theme colors
- Search settings
- Social links
- And more

See [VitePress documentation](https://vitepress.dev/reference/site-config) for all options.

## Writing Documentation

VitePress uses Markdown with some extensions:

- **Frontmatter**: YAML at the top of files for metadata
- **Custom containers**: :::tip, :::warning, :::danger
- **Code highlighting**: Syntax highlighting for code blocks
- **Internal links**: Use relative paths like `[text](./other-page.md)`

Example:

```markdown
---
title: My Page
---

# Heading

Some text with a [link](./other-page.md)

:::tip
This is a tip
:::

\```typescript
const foo = 'bar';
\```
```

## Troubleshooting

### Port 5173 already in use

VitePress uses port 5173 by default (same as the Rewind frontend). To use a different port:

```bash
vitepress dev --port 5174
```

Or add to package.json:
```json
"dev": "vitepress dev --port 5174"
```

### Build fails

Make sure all Markdown links are valid and point to existing files.

---

For more information, see the [VitePress documentation](https://vitepress.dev/).
