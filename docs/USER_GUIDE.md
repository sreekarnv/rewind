# Rewind User Guide

Complete guide to using Rewind for HTTP traffic analysis and debugging.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Capture Management](#capture-management)
3. [Session Viewing](#session-viewing)
4. [Request Replay](#request-replay)
5. [Alert System](#alert-system)
6. [Email Notifications](#email-notifications)
7. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### First Time Setup

1. **Start MongoDB**
   ```bash
   mongod --dbpath /path/to/data
   ```

2. **Start Backend API**
   ```bash
   cd services/backend-api
   bun run dev
   ```

3. **Start Frontend**
   ```bash
   cd services/frontend
   npm run dev
   ```

4. **Access the UI**
   Open http://localhost:5173 in your browser

### Dashboard Overview

The dashboard displays:
- **Active Sessions Count**: Total captured HTTP sessions
- **Capture Status**: Whether packet capture is running
- **Recent Activity**: Real-time session feed
- **Metrics**: Traffic statistics and response times

---

## Capture Management

### Starting Capture

1. Navigate to the **Capture** tab or click **Start Capture**
2. Select your network interface from the list:
   - **Loopback (127.0.0.1)**: Captures local traffic only
   - **Ethernet/Wi-Fi adapters**: Captures external traffic
3. Capture begins immediately upon interface selection

### In-Browser Terminal

The built-in terminal provides:
- **Real-time Logs**: See packet capture events as they happen
- **Interactive Controls**: Send commands to the capture agent
- **Status Updates**: Monitor capture agent health

### Stopping/Restarting Capture

- **Stop**: Gracefully shuts down the capture agent (`SIGTERM`)
- **Restart**: Stops and restarts the agent (useful after config changes)
- **Status**: View current state, PID, and uptime

---

## Session Viewing

### Sessions List

The sessions page shows all captured HTTP transactions:

**Columns:**
- **Method**: HTTP method (GET, POST, PUT, DELETE, etc.)
- **URI**: Request path and query string
- **Status Code**: HTTP response status (200, 404, 500, etc.)
- **Source IP**: Client IP address
- **Destination IP**: Server IP address
- **Timestamp**: When the request was captured

**Indicators:**
- **Pending**: No response received yet (incomplete transaction)
- **Color Coding**: Status codes use semantic colors
  - 2xx: Green (Success)
  - 3xx: Blue (Redirect)
  - 4xx: Yellow (Client Error)
  - 5xx: Red (Server Error)

### Session Details

Click any session to view full details:

#### 1. **Overview Tab**
- Session ID, timestamp, IP addresses
- Request/response roundtrip summary
- Quick stats (headers count, body size)

#### 2. **Request Tab**
- **General**: Method, URI, HTTP version
- **Headers**: All request headers with syntax highlighting
- **Body**: Request payload (formatted JSON, form data, etc.)
- **Parsed Data**:
  - Query Parameters (automatically extracted from URI)
  - Cookies (parsed from Cookie header)
  - Form Data (if Content-Type is form-urlencoded)

#### 3. **Response Tab**
- **General**: Status code, status message, HTTP version
- **Headers**: All response headers
- **Body**: Response payload (pretty-printed JSON, HTML, etc.)

#### 4. **Actions**
- **Replay Request**: Re-send the exact same request
- **Copy as cURL**: Get cURL command for the request
- **Delete Session**: Remove from database

---

## Request Replay

### Basic Replay

1. Open any session detail page
2. Click **Replay Request** button
3. View the response in the replay modal:
   - **Status**: Success/Error indicator
   - **Response Time**: How long the request took
   - **Response Headers**: All headers returned
   - **Response Body**: Formatted response payload

### Use Cases

- **Debugging**: Test if an issue still occurs
- **Testing**: Verify API behavior after changes
- **Development**: Quickly re-trigger requests without finding original source
- **Comparison**: Compare current vs. captured responses

### Replay Limitations

- Replays send requests from the **backend server** (not your browser)
- Authentication tokens may have expired
- Server state may have changed (POST/PUT/DELETE side effects)
- CORS policies don't apply (server-side request)

---

## Alert System

### Creating Alert Rules

1. Navigate to **Alerts** page
2. Click **Create Alert Rule**
3. Configure the rule:

**Basic Settings:**
- **Name**: Descriptive name (e.g., "High Error Rate")
- **Description**: Optional context
- **Severity**: info, warning, error, or critical
- **Cooldown**: Minutes before rule can trigger again

**Conditions:**

Add one or more conditions (ALL must match):

| Condition Type | Operators | Example Values |
|---------------|-----------|----------------|
| **Status Code** | equals, not_equals, greater_than, less_than | 200, 404, 500 |
| **Status Range** | equals | 2xx, 3xx, 4xx, 5xx |
| **Response Time** | greater_than, less_than | 1000 (ms) |
| **HTTP Method** | equals, not_equals | GET, POST, PUT |
| **URL Pattern** | contains, regex | /api/users, ^/admin/.*$ |

**Example Rules:**

1. **Server Errors**
   ```
   Condition: Status Range = 5xx
   Severity: error
   Cooldown: 5 minutes
   ```

2. **Slow Requests**
   ```
   Condition: Response Time > 2000
   Severity: warning
   Cooldown: 10 minutes
   ```

3. **Failed Logins**
   ```
   Condition 1: URL Pattern contains "/auth/login"
   Condition 2: Status Code = 401
   Severity: warning
   Cooldown: 1 minute
   ```

### Managing Alerts

- **Enable/Disable**: Toggle rules on/off without deleting
- **Edit**: Modify conditions or settings
- **Delete**: Remove rule permanently
- **View Triggered**: See when and how often each rule triggered

### Notifications

When an alert triggers:
1. **Notification Created**: Stored in database
2. **Real-time Update**: Appears instantly in UI (WebSocket)
3. **Email Sent**: If email notifications enabled
4. **Badge Counter**: Notification bell shows unread count

**Notification Actions:**
- **View Session**: Jump to the session that triggered the alert
- **Mark as Read**: Dismiss the unread indicator
- **Dismiss**: Archive the notification

---

## Email Notifications

### Setup

See [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md) for detailed instructions.

**Quick Setup (Gmail):**

1. Enable 2FA on Gmail account
2. Generate App Password
3. Update `.env`:
   ```bash
   EMAIL_ENABLED=true
   EMAIL_SMTP_HOST=smtp.gmail.com
   EMAIL_SMTP_PORT=587
   EMAIL_SMTP_USER=your-email@gmail.com
   EMAIL_SMTP_PASS=app-password
   EMAIL_RECIPIENT=admin@example.com
   ```
4. Restart backend

### Email Format

Emails include:
- **Severity Badge**: Color-coded (🔴 Critical, 🟠 Error, 🟡 Warning, 🔵 Info)
- **Alert Rule Name**: What triggered
- **Alert Message**: Details about the triggered session
- **Session Details Table**: Method, URI, status code, IPs, timestamp
- **View Session Button**: Direct link to session in UI

### Email Status

In the UI, notifications show email delivery status:
- **Green "Sent" Badge**: Email delivered successfully
- **Red "Failed" Badge**: Email delivery failed (hover for error)
- **No Badge**: Email notifications disabled

### Troubleshooting

**Emails not sending:**
1. Check `EMAIL_ENABLED=true` in `.env`
2. Verify SMTP credentials
3. Check backend logs for errors
4. Test with Ethereal Email (fake SMTP for testing)

**Emails in spam:**
- Use reputable SMTP provider (Gmail, SendGrid)
- Configure SPF/DKIM/DMARC for your domain
- Use clear, non-spammy subject lines

---

## Tips & Best Practices

### Capture Optimization

1. **Use Specific Interfaces**: Capture only the traffic you need
2. **Filter Early**: Use alert rules to focus on important events
3. **Clear Old Sessions**: Regularly clean up to maintain performance
4. **Monitor Storage**: Large captures consume disk space

### Alert Strategy

1. **Start Conservative**: Use higher cooldowns initially to avoid spam
2. **Severity Matters**: Reserve "critical" for truly critical issues
3. **Test Rules**: Create, test, then enable for production
4. **Combine Conditions**: Use multiple conditions for precise matching
5. **Email Wisely**: Only email for errors/critical, not info

### Performance

1. **Database Indexing**: MongoDB indexes are already optimized
2. **Limit Query Results**: Use pagination on large datasets
3. **Close Old Sessions**: Delete sessions you no longer need
4. **WebSocket Efficiency**: Real-time updates are lightweight

### Debugging Workflow

1. **Capture Traffic**: Start capture on relevant interface
2. **Reproduce Issue**: Perform the action causing problems
3. **Review Sessions**: Find the problematic request
4. **Inspect Details**: Check headers, payloads, status codes
5. **Replay & Test**: Modify and replay to verify fixes
6. **Set Alert**: Create rule to monitor for recurrence

### Security Considerations

1. **PII**: Capture agent sanitizes sensitive data automatically
2. **Access Control**: Restrict access to Rewind UI in production
3. **HTTPS**: Use HTTPS for production deployments
4. **Email Security**: Use app passwords, not plain passwords
5. **Data Retention**: Set policies for how long to keep sessions

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Quick search (if implemented) |
| `Esc` | Close modal/panel |
| `R` | Replay current session |
| `N` | View notifications |

---

## Frequently Asked Questions

### Q: Why are some sessions marked as "Pending"?
**A:** The request was captured but no response has been received yet. This is normal for long-running requests or if the server didn't respond.

### Q: Can I capture HTTPS traffic?
**A:** Rewind captures the encrypted packets but cannot decrypt HTTPS without a man-in-the-middle proxy. Use it alongside tools like mitmproxy for HTTPS decryption.

### Q: How do I capture traffic from a specific application?
**A:** Capture on the loopback interface (127.0.0.1) if the app uses localhost, or filter by port/IP in your alert rules.

### Q: Does Rewind work on mobile devices?
**A:** The UI is mobile-responsive, but the capture agent requires a desktop/server environment. You can view captures from mobile browsers.

### Q: Can I export sessions?
**A:** Currently, you can copy requests as cURL. Full export features are planned for future releases.

### Q: What's the performance impact?
**A:** The C++ capture agent is highly optimized with minimal overhead. The backend and frontend are designed for real-time performance.

---

## Getting Help

- **Documentation**: Check the docs/ folder
- **Issues**: Report bugs on GitHub
- **Email**: Check [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md) for email-specific help
- **Logs**: Backend logs contain detailed error information

---

**Happy Debugging! 🐛🔍**
