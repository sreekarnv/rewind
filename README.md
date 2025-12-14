<div align="center">

# Rewind - Real-time HTTP Traffic Analyzer

[![Bun](https://img.shields.io/badge/Bun-1.x-fbf02a?style=flat-square&logo=bun&logoColor=black)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-1.x-FF3E00?style=flat-square&logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![ElysiaJS](https://img.shields.io/badge/ElysiaJS-API-5e165d?style=flat-square&logo=elysia&logoColor=white)](https://elysiajs.com/)
[![C++](https://img.shields.io/badge/C%2B%2B-Core-00599C?style=flat-square&logo=cplusplus&logoColor=white)](https://isocpp.org/)
[![Prometheus](https://img.shields.io/badge/Prometheus-Metrics-E6522C?style=flat-square&logo=prometheus&logoColor=white)](https://prometheus.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)


**A high-performance, full-stack application for capturing, processing, and visualizing low-level HTTP network traffic in real-time.**


</div>

---

## Overview

Rewind is a modern debugging and monitoring tool designed to provide deep insight into network activity. It utilizes a decoupled architecture where a high-performance C++ agent handles raw packet capture, and a Bun/SvelteKit stack delivers a real-time, interactive web experience. It eliminates the need for manual command-line interaction by integrating capture controls and a terminal directly into the browser.

---

## 🛠️ Tech Stack

<p align="left">
  <a href="https://bun.sh/">
    <img src="https://img.shields.io/badge/Bun-fbf02a?style=for-the-badge&logo=bun&logoColor=black" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  </a>
  <a href="https://kit.svelte.dev/">
    <img src="https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white" />
  </a>
  <a href="https://elysiajs.com/">
    <img src="https://img.shields.io/badge/ElysiaJS-5e165d?style=for-the-badge&logo=elysia&logoColor=white" />
  </a>
  <a href="https://isocpp.org/">
    <img src="https://img.shields.io/badge/C%2B%2B-00599C?style=for-the-badge&logo=cplusplus&logoColor=white" />
  </a>
  <a href="https://prometheus.io/">
    <img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white" />
  </a>
</p>

---

## ✨ Features

- **🌐 In-Browser Capture Terminal:** Interact with the C++ capture agent to select network interfaces, view real-time logs, and monitor the capture process directly from the web UI via a two-way WebSocket stream.
- **🎮 Seamless Capture Controls:** Start, Stop, and Restart the low-level C++ process using a dedicated control panel in the browser. Features graceful shutdown using `SIGTERM` with a `SIGKILL` fallback for process cleanup.
- **📈 Real-time Traffic Metrics:** The UI polls the backend status every 2 seconds to ensure the status, uptime, and process ID are always up-to-date, and to catch process crashes immediately.
- **🛡️ Robust Data Handling (Incomplete Transactions):** Gracefully handles sessions where a request lacks a response by making response-related fields optional, marking these transactions as **`Pending`** in the UI, and preventing crashes.
- **✅ Consistent Data Format (CamelCase):** Standardizes all field names to **`camelCase`** (`sessionId`, `clientIp`, `statusCode`) across the C++ agent's JSON output, Backend TypeScript interfaces, and Frontend Svelte components to ensure data integrity and prevent `undefined` errors.
- **🔒 PII Sanitization (Inferred from Docs):** The C++ capture agent is designed to automatically anonymize sensitive data (e.g., email addresses, API keys) during packet capture.

---

## 🏛️ Architecture

Rewind employs a high-performance three-tier structure to decouple low-level capture from the high-level analysis and UI.

The central component is the **Backend API**, which acts as a bridge, process manager, and real-time data broadcaster.

**Component Roles:**
* **C++ Capture Agent:** Performs raw packet capture, HTTP reassembly, PII sanitization, and writes session data to a JSON file.
* **Backend API (Bun/Elysia):** Runs the **Capture Manager** service, which handles the C++ process lifecycle and manages the two-way `ws://.../stream` WebSocket for terminal I/O and real-time data broadcasting.
* **Frontend UI (SvelteKit):** Provides the interactive dashboard, session viewer, control panel, and the built-in Capture Terminal.

---

## 🚀 Quick Start

### Prerequisites

- **Bun 1.0+** (Recommended) or Node.js 18+
- **Administrator / `sudo` access** (Required for the C++ capture agent to access network interfaces)

### Installation & Run

1.  **Clone the repository**
    ```bash
    git clone <your-repo-link>
    cd rewind
    ```

2.  **Install dependencies**
    ```bash
    cd services/backend-api && bun install
    cd ../frontend && npm install # or bun install
    ```

3.  **Start Services (Recommended: Browser Control)**
    Run the Backend API with elevated permissions to enable in-browser controls and the terminal feature:

    | Component | Command (Admin/sudo) | Port |
    | :--- | :--- | :--- |
    | **Backend API** | `cd services/backend-api && sudo bun run dev` | `8000` |
    | **Frontend UI** | `cd services/frontend && npm run dev` | `5173` |

4.  **Access UI**
    Open your browser to: **http://localhost:5173**

5.  **Start Capture**
    Click the **Start Capture** button in the UI and use the **built-in terminal** to select your network interface.

---

## Core Components

| Component | Stack | Port | Description |
|---------|------|-------------|
| **Frontend** | SvelteKit | 5173 | Real-time dashboard, Session Viewer, Capture Controls & Terminal. |
| **Backend API** | Bun + Elysia | 8000 | Capture Manager, File Watcher, WebSocket Streamer, REST API. |
| **Capture Agent** | C++ | N/A | Low-level packet capture, HTTP reassembly, PII filtering. |
| **Metrics** | Prometheus | 9090 | Metrics endpoint exposed by the C++ agent. |

---

## API Examples

The Backend API is built with Elysia and exposes control endpoints via REST.

### Capture Status & Control
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/capture/status` | `GET` | Get current capture state (running, stopped, error) |
| `/api/v1/capture/start` | `POST` | Start the C++ capture agent process |
| `/api/v1/capture/stop` | `POST` | Stop the capture agent with graceful shutdown |
| `/api/v1/capture/restart` | `POST` | Restart the capture agent |

### Real-time Data Endpoints

```bash
# Get all session summaries
curl http://localhost:8000/api/v1/sessions

# Get session details by ID
curl http://localhost:8000/api/v1/sessions/:sessionId

# WebSocket for Terminal I/O & Live Updates
Connect to: ws://localhost:8000/api/v1/capture/stream
