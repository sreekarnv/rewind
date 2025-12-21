---
layout: home

hero:
  name: Rewind
  text: Real-time HTTP Traffic Analyzer
  tagline: High-performance packet capture and analysis tool for debugging and monitoring
  actions:
    - theme: brand
      text: Get Started
      link: /USER_GUIDE
    - theme: alt
      text: Developer Guide
      link: /DEVELOPER_GUIDE
    - theme: alt
      text: View on GitHub
      link: https://github.com/sreekarnv/rewind

features:
  - icon: 🌐
    title: In-Browser Capture Terminal
    details: Interact with the C++ capture agent to select network interfaces, view real-time logs, and monitor the capture process directly from the web UI.

  - icon: 🔄
    title: Request Replay
    details: Re-send captured HTTP requests with one click. Perfect for debugging and testing API endpoints without external tools.

  - icon: 🔔
    title: Smart Alert System
    details: Create custom alert rules based on status codes, response times, HTTP methods, URL patterns, and more with email notifications.

  - icon: 📊
    title: Real-time Metrics
    details: Monitor traffic in real-time with WebSocket updates, view detailed session information, and analyze HTTP transactions as they happen.

  - icon: 🔍
    title: Enhanced Headers Viewer
    details: Beautiful, organized display of HTTP headers with syntax highlighting, categorization, and automatic parsing of cookies and query parameters.

  - icon: 🛡️
    title: PII Sanitization
    details: Automatically anonymizes sensitive data (email addresses, API keys) during packet capture to protect privacy.

  - icon: ⚡
    title: High Performance
    details: Built with C++ for packet capture, Bun for the backend, and SvelteKit for the frontend. Optimized for real-time performance.

  - icon: 📧
    title: Email Notifications
    details: Get notified via email when alerts trigger. Supports SMTP with beautiful HTML email templates and retry logic.
---

## Screenshots

<div class="screenshots-grid">
  <div class="screenshot-item">
    <img src="/metrics.png" alt="Real-time Metrics Dashboard">
    <p>Real-time Metrics Dashboard</p>
  </div>
  <div class="screenshot-item">
    <img src="/session-detail.png" alt="Session Detail View">
    <p>Detailed Session Analysis</p>
  </div>
  <div class="screenshot-item">
    <img src="/alert-rules.png" alt="Alert Rules Management">
    <p>Custom Alert Rules</p>
  </div>
</div>

## Quick Start

Get up and running with Rewind in minutes:

```bash
# Clone the repository
git clone https://github.com/sreekarnv/rewind.git
cd rewind

# Build capture agent (Windows)
cd services/capture-agent && build.bat

# Install backend dependencies
cd ../backend-api && bun install

# Install frontend dependencies
cd ../frontend && bun install

# Start MongoDB
mongod --dbpath /path/to/data

# Start backend (requires admin/sudo)
cd services/backend-api && bun run dev

# Start frontend
cd services/frontend && npm run dev

# Access UI at http://localhost:5173
```

## Tech Stack

<div class="tech-stack-grid">
  <div class="tech-item">
    <img src="https://img.shields.io/badge/Bun-fbf02a?style=for-the-badge&logo=bun&logoColor=black" alt="Bun">
    <p>Lightning-fast JavaScript runtime</p>
  </div>
  <div class="tech-item">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <p>Type-safe development</p>
  </div>
  <div class="tech-item">
    <img src="https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white" alt="SvelteKit">
    <p>Modern web framework</p>
  </div>
  <div class="tech-item">
    <img src="https://img.shields.io/badge/C%2B%2B-00599C?style=for-the-badge&logo=cplusplus&logoColor=white" alt="C++">
    <p>High-performance capture agent</p>
  </div>
  <div class="tech-item">
    <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
    <p>Document database</p>
  </div>
  <div class="tech-item">
    <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS">
    <p>Utility-first CSS</p>
  </div>
  <div class="tech-item">
    <img src="https://img.shields.io/badge/ElysiaJS-5e165d?style=for-the-badge&logo=elysia&logoColor=white" alt="ElysiaJS">
    <p>Fast Bun web framework</p>
  </div>
  <div class="tech-item">
    <img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white" alt="Prometheus">
    <p>Metrics & monitoring</p>
  </div>
</div>

## Use Cases

- **API Debugging** - Capture and analyze HTTP requests/responses in real-time
- **Performance Monitoring** - Track response times, identify slow endpoints
- **Security Analysis** - Monitor for suspicious patterns, unauthorized access
- **Integration Testing** - Verify API behavior, inspect headers and payloads
- **Error Tracking** - Get alerted when errors occur, debug with full context
- **Traffic Analysis** - Understand application behavior, identify bottlenecks

## Documentation

- [User Guide](/USER_GUIDE) - Complete guide for using Rewind
- [Developer Guide](/DEVELOPER_GUIDE) - Development setup and architecture
- [Email Setup Guide](/EMAIL_SETUP_GUIDE) - Detailed email configuration
- [Alert System](/EMAIL_ALERT_SYSTEM_COMPLETE) - Alert system documentation

## License

Released under the [MIT License](https://github.com/sreekarnv/rewind/blob/main/LICENSE).

<style>
/* Screenshots Grid */
.screenshots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin: 3rem 0;
}

.screenshot-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.screenshot-item img {
  width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid var(--vp-c-divider);
}

.screenshot-item img:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.screenshot-item p {
  margin: 0;
  text-align: center;
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-size: 1rem;
}

/* Tech Stack Grid */
.tech-stack-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.tech-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.tech-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.tech-item img {
  margin-bottom: 1rem;
  height: 28px;
  width: auto;
}

.tech-item p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .screenshots-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .tech-stack-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .tech-item {
    padding: 1rem;
  }
}
</style>
