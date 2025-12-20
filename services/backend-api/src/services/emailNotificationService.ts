import nodemailer, { Transporter } from 'nodemailer';
import { EventEmitter } from 'node:events';
import { INotification, Notification } from '../models/Notification';

interface EmailConfig {
	enabled: boolean;
	smtp: {
		host: string;
		port: number;
		secure: boolean;
		auth: {
			user: string;
			pass: string;
		};
	};
	from: string;
	recipient: string;
	retryAttempts: number;
	retryDelay: number;
	frontendUrl: string;
}

interface SeverityStyle {
	bg: string;
	text: string;
	icon: string;
}

export class EmailNotificationService extends EventEmitter {
	private readonly config: EmailConfig;
	private transporter: Transporter | null = null;
	private isConfigured: boolean = false;

	private readonly SEVERITY_COLORS: Record<string, SeverityStyle> = {
		critical: { bg: '#DC2626', text: '#FFFFFF', icon: '🔴' },
		error: { bg: '#EA580C', text: '#FFFFFF', icon: '🟠' },
		warning: { bg: '#F59E0B', text: '#000000', icon: '🟡' },
		info: { bg: '#3B82F6', text: '#FFFFFF', icon: '🔵' },
	};

	constructor() {
		super();
		this.config = this.loadConfig();

		if (this.config.enabled) {
			this.initialize();
		} else {
			console.log('Email notifications disabled (EMAIL_ENABLED=false)');
		}
	}

	private loadConfig(): EmailConfig {
		return {
			enabled: process.env.EMAIL_ENABLED === 'true',
			smtp: {
				host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
				port: Number.parseInt(process.env.EMAIL_SMTP_PORT || '587'),
				secure: process.env.EMAIL_SMTP_SECURE === 'true',
				auth: {
					user: process.env.EMAIL_SMTP_USER || '',
					pass: process.env.EMAIL_SMTP_PASS || '',
				},
			},
			from: process.env.EMAIL_FROM || 'Rewind Alerts <noreply@rewind.local>',
			recipient: process.env.EMAIL_RECIPIENT || '',
			retryAttempts: Number.parseInt(process.env.EMAIL_RETRY_ATTEMPTS || '3'),
			retryDelay: Number.parseInt(process.env.EMAIL_RETRY_DELAY || '2000'),
			frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
		};
	}

	private async initialize(): Promise<void> {
		try {
			if (!this.validateConfig()) {
				console.warn(
					'Email notifications disabled: Missing or invalid configuration'
				);
				this.emit('config_invalid', { errors: ['Missing required fields'] });
				return;
			}

			this.transporter = nodemailer.createTransport({
				host: this.config.smtp.host,
				port: this.config.smtp.port,
				secure: this.config.smtp.secure,
				auth: this.config.smtp.auth,
			});

			await this.transporter.verify();

			this.isConfigured = true;
			console.log(
				`Email notifications enabled: ${this.config.smtp.host}:${this.config.smtp.port}`
			);
			this.emit('config_validated', {
				host: this.config.smtp.host,
				port: this.config.smtp.port,
				secure: this.config.smtp.secure,
			});
		} catch (error) {
			console.error('Failed to initialize email service:', error);
			this.emit('config_invalid', { errors: [error] });
			this.isConfigured = false;
		}
	}

	private validateConfig(): boolean {
		return !!(
			this.config.smtp.host &&
			this.config.smtp.port &&
			this.config.smtp.auth.user &&
			this.config.smtp.auth.pass &&
			this.config.from &&
			this.config.recipient
		);
	}

	public async sendNotificationEmail(
		notification: INotification
	): Promise<void> {
		if (!this.isConfigured) {
			return;
		}

		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
			try {
				await this.attemptSend(notification, attempt);
				await this.markEmailSent(notification);
				this.emit('email_sent', {
					notificationId: notification._id,
					recipient: this.config.recipient,
				});
				console.log(
					`Email sent for notification ${notification._id} to ${this.config.recipient}`
				);
				return;
			} catch (error) {
				lastError = error as Error;
				this.emit('email_failed', {
					notificationId: notification._id,
					error: lastError.message,
					attempt,
				});
				console.error(
					`Email send attempt ${attempt}/${this.config.retryAttempts} failed for notification ${notification._id}:`,
					lastError.message
				);

				if (attempt < this.config.retryAttempts) {
					const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
					await this.sleep(delay);
				}
			}
		}

		await this.markEmailFailed(notification, lastError);
		console.error(
			`Failed to send email for notification ${notification._id} after ${this.config.retryAttempts} attempts:`,
			lastError?.message
		);
	}

	private async attemptSend(
		notification: INotification,
		attempt: number
	): Promise<void> {
		if (!this.transporter) {
			throw new Error('Email transporter not initialized');
		}

		const subject = `[${notification.severity.toUpperCase()}] Rewind Alert: ${
			notification.ruleName
		}`;
		const html = this.generateEmailHTML(notification);
		const text = this.generateEmailText(notification);

		await this.transporter.sendMail({
			from: this.config.from,
			to: this.config.recipient,
			subject,
			html,
			text,
		});

		await Notification.findByIdAndUpdate(notification._id, {
			$set: { emailAttempts: attempt },
		});
	}

	private generateEmailHTML(notification: INotification): string {
		const severityStyle =
			this.SEVERITY_COLORS[notification.severity] || this.SEVERITY_COLORS.info;
		const sessionLink = this.buildSessionDetailsLink(notification.sessionId);
		const timestamp = new Date(
			notification.sessionData.timestamp
		).toLocaleString();

		return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rewind Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background-color: #1f2937; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                Rewind Alert System
              </h1>
            </td>
          </tr>

          <!-- Severity Badge -->
          <tr>
            <td style="padding: 24px 32px;">
              <div style="background-color: ${severityStyle.bg}; color: ${
			severityStyle.text
		}; padding: 16px 24px; border-radius: 8px; text-align: center; font-weight: 700; font-size: 18px;">
                ${
									severityStyle.icon
								} ${notification.severity.toUpperCase()} ALERT
              </div>
              <h2 style="margin: 16px 0 8px; color: #111827; font-size: 20px; font-weight: 600;">
                ${notification.ruleName}
              </h2>
              ${
								notification.message
									? `<p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">${notification.message}</p>`
									: ''
							}
            </td>
          </tr>

          <!-- Session Details -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td colspan="2" style="padding: 16px; background-color: #e5e7eb;">
                    <h3 style="margin: 0; color: #374151; font-size: 16px; font-weight: 600;">Session Details</h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #6b7280; font-size: 14px; font-weight: 500; border-bottom: 1px solid #e5e7eb;">Session ID:</td>
                  <td style="padding: 12px 16px; color: #111827; font-size: 14px; font-family: 'Courier New', monospace; border-bottom: 1px solid #e5e7eb;">${
										notification.sessionId
									}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #6b7280; font-size: 14px; font-weight: 500; border-bottom: 1px solid #e5e7eb;">Timestamp:</td>
                  <td style="padding: 12px 16px; color: #111827; font-size: 14px; border-bottom: 1px solid #e5e7eb;">${timestamp}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #6b7280; font-size: 14px; font-weight: 500; border-bottom: 1px solid #e5e7eb;">Method:</td>
                  <td style="padding: 12px 16px; color: #111827; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${
										notification.sessionData.method
									}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #6b7280; font-size: 14px; font-weight: 500; border-bottom: 1px solid #e5e7eb;">URI:</td>
                  <td style="padding: 12px 16px; color: #111827; font-size: 14px; font-family: 'Courier New', monospace; word-break: break-all; border-bottom: 1px solid #e5e7eb;">${
										notification.sessionData.uri
									}</td>
                </tr>
                ${
									notification.sessionData.statusCode
										? `
                <tr>
                  <td style="padding: 12px 16px; color: #6b7280; font-size: 14px; font-weight: 500; border-bottom: 1px solid #e5e7eb;">Status Code:</td>
                  <td style="padding: 12px 16px; color: #111827; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${notification.sessionData.statusCode}</td>
                </tr>
                `
										: ''
								}
                <tr>
                  <td style="padding: 12px 16px; color: #6b7280; font-size: 14px; font-weight: 500; border-bottom: 1px solid #e5e7eb;">Source IP:</td>
                  <td style="padding: 12px 16px; color: #111827; font-size: 14px; font-family: 'Courier New', monospace; border-bottom: 1px solid #e5e7eb;">${
										notification.sessionData.sourceIp
									}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #6b7280; font-size: 14px; font-weight: 500;">Destination IP:</td>
                  <td style="padding: 12px 16px; color: #111827; font-size: 14px; font-family: 'Courier New', monospace;">${
										notification.sessionData.destIp
									}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action Button -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <a href="${sessionLink}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                View Session Details
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; text-align: center; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                Generated by Rewind Alert System
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
	}

	private generateEmailText(notification: INotification): string {
		const timestamp = new Date(
			notification.sessionData.timestamp
		).toLocaleString();
		const sessionLink = this.buildSessionDetailsLink(notification.sessionId);

		return `
REWIND ALERT SYSTEM

[${notification.severity.toUpperCase()}] ALERT

Rule: ${notification.ruleName}
${notification.message ? `\nMessage: ${notification.message}` : ''}

SESSION DETAILS
==============
Session ID: ${notification.sessionId}
Timestamp: ${timestamp}
Method: ${notification.sessionData.method}
URI: ${notification.sessionData.uri}
${
	notification.sessionData.statusCode
		? `Status Code: ${notification.sessionData.statusCode}`
		: ''
}
Source IP: ${notification.sessionData.sourceIp}
Destination IP: ${notification.sessionData.destIp}

View full details: ${sessionLink}

---
Generated by Rewind Alert System
    `.trim();
	}

	private buildSessionDetailsLink(sessionId: string): string {
		return `${this.config.frontendUrl}/sessions/${sessionId}`;
	}

	private async markEmailSent(notification: INotification): Promise<void> {
		await Notification.findByIdAndUpdate(notification._id, {
			$set: {
				emailSent: true,
				emailSentAt: new Date(),
			},
		});
	}

	private async markEmailFailed(
		notification: INotification,
		error: Error | null
	): Promise<void> {
		await Notification.findByIdAndUpdate(notification._id, {
			$set: {
				emailError: error?.message || 'Unknown error',
			},
		});
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
