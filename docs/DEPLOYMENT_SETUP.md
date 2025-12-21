# Documentation Deployment Setup

This document describes how the Rewind documentation is organized and deployed.

## Structure

All documentation is now centralized in the `docs/` directory:

```
docs/
├── .vitepress/           # VitePress configuration
│   ├── config.js         # Site configuration
│   └── dist/             # Build output (generated)
├── public/               # Static assets
│   └── logo.svg          # Site logo
├── screenshots/          # Documentation screenshots
├── index.md              # Homepage
├── USER_GUIDE.md         # User guide
├── DEVELOPER_GUIDE.md    # Developer guide
├── EMAIL_SETUP_GUIDE.md  # Email setup guide
├── README.md             # Docs development guide
└── package.json          # Dependencies
```

## Technology

The documentation is built with **[VitePress](https://vitepress.dev/)**, a static site generator powered by Vite and Vue.

### Why VitePress?

- **Fast**: Lightning-fast hot reload and build times
- **Markdown-based**: Easy to write and maintain
- **Searchable**: Built-in search functionality
- **Themeable**: Beautiful default theme with customization options
- **Developer-friendly**: Supports Vue components, syntax highlighting, custom containers

## Development

### Local Development

```bash
cd docs
bun install
bun run dev
```

Visit http://localhost:5173 (or http://localhost:5174 if the frontend is using 5173)

### Build

```bash
cd docs
bun run build
```

Output will be in `.vitepress/dist`

### Preview Production Build

```bash
cd docs
bun run preview
```

## Deployment

### GitHub Pages (Automatic)

The repository includes a GitHub Actions workflow (`.github/workflows/deploy-docs.yml`) that automatically deploys documentation to GitHub Pages when changes are pushed to the `main` branch.

**Setup Steps:**

1. Go to repository Settings > Pages
2. Set Source to "GitHub Actions"
3. Push changes to `main` branch
4. Workflow will build and deploy automatically
5. Docs will be available at: https://sreekarnv.github.io/rewind/

**Workflow Triggers:**
- Push to `main` branch with changes in `docs/` directory
- Manual trigger via "Actions" tab (workflow_dispatch)

### Alternative Deployment Options

#### Vercel

```bash
# Import repository to Vercel
# Set these options:
Build Command: cd docs && bun run build
Output Directory: docs/.vitepress/dist
Install Command: cd docs && bun install
```

#### Netlify

```bash
# Import repository to Netlify
# Set these options:
Build Command: cd docs && bun run build
Publish Directory: docs/.vitepress/dist
```

#### Cloudflare Pages

```bash
# Connect repository to Cloudflare Pages
# Set these options:
Build Command: cd docs && bun run build
Build Output Directory: docs/.vitepress/dist
```

#### Manual Deployment

```bash
# Build the site
cd docs && bun run build

# Deploy the .vitepress/dist folder to your hosting provider
# For example, using rsync:
rsync -avz .vitepress/dist/ user@server:/var/www/rewind-docs/
```

## Configuration

The VitePress configuration is in `docs/.vitepress/config.js`.

### Key Configuration Options

- **title**: Site title
- **description**: Meta description for SEO
- **themeConfig.nav**: Top navigation bar
- **themeConfig.sidebar**: Left sidebar navigation
- **themeConfig.socialLinks**: Social media links
- **ignoreDeadLinks**: Patterns to ignore during link checking

### Customization

To customize the theme, colors, or layout:

1. Edit `.vitepress/config.js` for configuration
2. Create `.vitepress/theme/index.js` for theme customization
3. Add custom CSS in `.vitepress/theme/custom.css`

See [VitePress Theme documentation](https://vitepress.dev/guide/extending-default-theme) for details.

## Updating Documentation

### Adding a New Page

1. Create a new `.md` file in `docs/` directory
2. Add frontmatter if needed:
   ```markdown
   ---
   title: My New Page
   description: Page description
   ---
   ```
3. Update `docs/.vitepress/config.js` to add the page to navigation/sidebar
4. Build and test locally

### Editing Existing Pages

1. Edit the `.md` file directly
2. Use hot reload to preview changes (`bun run dev`)
3. Commit and push changes
4. GitHub Actions will automatically deploy

### Adding Screenshots

1. Add images to `docs/public/`
2. Reference in markdown:
   ```markdown
   ![Alt text](./screenshots/image.png)
   # or for public directory:
   ![Alt text](/image.png)
   ```

## Search

VitePress includes built-in local search powered by [minisearch](https://github.com/lucaong/minisearch).

Search is automatically indexed from all markdown content. No additional configuration needed.

## Troubleshooting

### Build Fails with "Dead Links"

VitePress validates all internal links during build. If you have example URLs (like localhost), add them to `ignoreDeadLinks` in config:

```javascript
ignoreDeadLinks: [
  /^http:\/\/localhost/,
  /^https:\/\/example\.com/
]
```

### Port 5173 Already in Use

Change the port in package.json:

```json
"dev": "vitepress dev --port 5174"
```

### Styling Issues

VitePress uses the default theme. If you need custom styles, create:

```
docs/.vitepress/theme/
├── index.js          # Theme entry point
└── custom.css        # Custom styles
```

Then in `index.js`:
```javascript
import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default DefaultTheme
```

## Maintenance

### Updating VitePress

```bash
cd docs
bun update vitepress
```

### Checking for Broken Links

```bash
cd docs
bun run build  # Will fail if broken links found
```

---

For more information, see the [VitePress documentation](https://vitepress.dev/).
