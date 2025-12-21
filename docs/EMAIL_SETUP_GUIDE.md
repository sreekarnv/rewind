# Email Notification Setup Guide

## Overview
The email notification system sends HTML emails whenever alert rules are triggered. All severities (info, warning, error, critical) trigger email notifications.

## Quick Start - Ethereal Email (Recommended for Testing)

Ethereal Email is a fake SMTP service perfect for testing. Emails are not actually delivered, but you can view them in a web interface.

### Setup Steps:

1. **Get Ethereal Email Credentials**
   - Visit: https://ethereal.email/
   - Click "Create Ethereal Account"
   - Copy the SMTP credentials shown

2. **Update your `.env` file**
   ```env
   # Email Notification Configuration
   EMAIL_ENABLED=true
   EMAIL_SMTP_HOST=smtp.ethereal.email
   EMAIL_SMTP_PORT=587
   EMAIL_SMTP_SECURE=false
   EMAIL_SMTP_USER=<username-from-ethereal>
   EMAIL_SMTP_PASS=<password-from-ethereal>
   EMAIL_FROM=Rewind Alerts <noreply@rewind.local>
   EMAIL_RECIPIENT=test@example.com
   EMAIL_RETRY_ATTEMPTS=3
   EMAIL_RETRY_DELAY=2000
   FRONTEND_URL=http://localhost:5173
   ```

3. **Restart the backend**
   ```bash
   cd services/backend-api
   bun run dev
   ```

   You should see: `Email notifications enabled: smtp.ethereal.email:587`

4. **Trigger an Alert**
   - Create an alert rule via the UI (http://localhost:5173/alerts)
   - Make HTTP requests that match the rule conditions
   - Watch the backend logs for: `Email sent for notification <id>`

5. **View the Email**
   - Go back to https://ethereal.email/
   - Click "Open Ethereal Mail" or check your inbox
   - View the HTML formatted email

## Production Setup - Gmail

### Prerequisites:
- Gmail account
- 2-Factor Authentication enabled
- App Password generated

### Steps:

1. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

2. **Update `.env` file**
   ```env
   EMAIL_ENABLED=true
   EMAIL_SMTP_HOST=smtp.gmail.com
   EMAIL_SMTP_PORT=587
   EMAIL_SMTP_SECURE=false
   EMAIL_SMTP_USER=your-email@gmail.com
   EMAIL_SMTP_PASS=<16-char-app-password>
   EMAIL_FROM=Rewind Alerts <your-email@gmail.com>
   EMAIL_RECIPIENT=recipient@example.com
   EMAIL_RETRY_ATTEMPTS=3
   EMAIL_RETRY_DELAY=2000
   FRONTEND_URL=http://localhost:5173
   ```

3. **Restart backend and test**

**Gmail Limits:**
- 500 emails per day
- Use alert rule cooldowns to avoid hitting limits

## Other SMTP Providers

### SendGrid
- Free tier: 100 emails/day
- Requires API key setup

### Mailgun
- Free tier: 5000 emails/month
- Transactional email service

### AWS SES
- Very affordable pricing
- Requires AWS account and verification

## Email Template Features

The HTML emails include:

- **Severity Badge**: Color-coded (Red=Critical, Orange=Error, Yellow=Warning, Blue=Info)
- **Session Details Table**: Method, URI, Status Code, IPs, Timestamp
- **Clickable Button**: "View Session Details" links to frontend
- **Responsive Design**: Works on mobile and desktop
- **Plain Text Fallback**: For email clients that don't support HTML

## Testing Checklist

- [ ] SMTP credentials configured in `.env`
- [ ] `EMAIL_ENABLED=true` set
- [ ] Backend started successfully
- [ ] Backend logs show: "Email notifications enabled"
- [ ] Alert rule created and enabled
- [ ] Alert triggered (check backend logs)
- [ ] Email received (check inbox or Ethereal)
- [ ] HTML renders correctly
- [ ] Session link works and navigates to correct page

## Troubleshooting

### "Email notifications disabled"
**Cause**: `EMAIL_ENABLED=false` or missing configuration
**Solution**: Check `.env` file, ensure all required fields are set

### "Failed to initialize email service"
**Cause**: Invalid SMTP credentials or network issue
**Solution**:
- Verify SMTP credentials
- Check network connectivity
- Test with Ethereal Email first

### "Email sent" but not received
**Cause**:
- Using Ethereal Email (check web interface)
- Email in spam folder
- Invalid recipient address

**Solution**:
- Check spam folder
- Verify `EMAIL_RECIPIENT` address
- Check backend logs for errors

### "Failed to send email after 3 attempts"
**Cause**: Network issue, rate limiting, or SMTP server down

**Solution**:
- Check backend logs for specific error
- Verify SMTP server is accessible
- Check if provider has rate limits

## Monitoring Email Delivery

The system tracks email delivery in the database:

**Successful Send:**
- `emailSent: true`
- `emailSentAt: <timestamp>`
- `emailAttempts: 1` (or number of attempts before success)

**Failed Send:**
- `emailSent: false` (or undefined)
- `emailError: "<error message>"`
- `emailAttempts: 3` (max attempts)

You can query these in MongoDB:
```javascript
// Find notifications with email errors
db.notifications.find({ emailError: { $exists: true } })

// Find successfully sent emails
db.notifications.find({ emailSent: true })
```

## Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `EMAIL_ENABLED` | `false` | Master switch for email notifications |
| `EMAIL_SMTP_HOST` | `smtp.gmail.com` | SMTP server hostname |
| `EMAIL_SMTP_PORT` | `587` | SMTP port (587 for TLS, 465 for SSL) |
| `EMAIL_SMTP_SECURE` | `false` | Use SSL (true for port 465) |
| `EMAIL_SMTP_USER` | - | SMTP username/email |
| `EMAIL_SMTP_PASS` | - | SMTP password/app password |
| `EMAIL_FROM` | `Rewind Alerts <noreply@rewind.local>` | Sender address |
| `EMAIL_RECIPIENT` | - | Recipient email address |
| `EMAIL_RETRY_ATTEMPTS` | `3` | Number of retry attempts on failure |
| `EMAIL_RETRY_DELAY` | `2000` | Initial retry delay in milliseconds |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend URL for session links |

## Security Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use app passwords** - Don't use your main account password
3. **Rotate credentials regularly** - Especially for production
4. **Use environment-specific configs** - Different credentials for dev/staging/prod
5. **Monitor failed sends** - Set up alerts for persistent failures

## Next Steps

After testing:
1. Set up production SMTP provider
2. Configure SPF/DKIM/DMARC for your domain (if using custom domain)
3. Monitor email delivery rates
4. Adjust alert rule cooldowns to prevent email spam
5. Consider implementing email digest feature (future enhancement)
