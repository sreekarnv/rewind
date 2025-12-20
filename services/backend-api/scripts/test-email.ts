import mongoose from 'mongoose';
import { EmailNotificationService } from '../src/services/emailNotificationService';
import { Notification } from '../src/models/Notification';

const MONGODB_URI =
	process.env.MONGODB_URI ||
	'mongodb://root:example@127.0.0.1:27017/rewind?directConnection=true&authSource=admin';

async function testEmail() {
	console.log('🧪 Testing Email Notification System\n');

	await mongoose.connect(MONGODB_URI);
	console.log('Connected to MongoDB');

	const emailService = new EmailNotificationService();

	const emailEvents: any[] = [];

	emailService.on('email_sent', (data) => {
		console.log('Event: email_sent', data);
		emailEvents.push({ type: 'sent', data });
	});

	emailService.on('email_failed', (data) => {
		console.log('Event: email_failed', data);
		emailEvents.push({ type: 'failed', data });
	});

	console.log('Waiting for email service to initialize...');

	await new Promise((resolve, reject) => {
		const timeout = setTimeout(
			() => reject(new Error('Timeout waiting for config')),
			10000
		);

		emailService.on('config_validated', (data) => {
			clearTimeout(timeout);
			console.log('Event: config_validated', data);
			resolve(data);
		});

		emailService.on('config_invalid', (data) => {
			clearTimeout(timeout);
			console.log('Event: config_invalid', data);
			reject(new Error('Config invalid'));
		});
	});

	console.log('Email service is ready!\n');

	const notification = await Notification.findOne().sort({ createdAt: -1 });

	if (!notification) {
		console.error('No notifications found in database');
		process.exit(1);
	}

	console.log(`Sending test email for notification: ${notification._id}`);
	console.log(`Rule: ${notification.ruleName}`);
	console.log(`Severity: ${notification.severity}`);
	console.log(
		`Session: ${notification.sessionData.method} ${notification.sessionData.uri}`
	);

	try {
		await emailService.sendNotificationEmail(notification);
		console.log('Email send completed! Check the logs above for status.');

		const updated = await Notification.findById(notification._id);
		console.log(`Email Status:`);
		console.log(`- emailSent: ${updated?.emailSent}`);
		console.log(`- emailSentAt: ${updated?.emailSentAt}`);
		console.log(`- emailAttempts: ${updated?.emailAttempts}`);
		console.log(`- emailError: ${updated?.emailError || 'None'}`);

		if (updated?.emailSent) {
			console.log('SUCCESS! Email was sent successfully!');
			console.log('View your email at: https://ethereal.email');
			console.log('Username: ydajt6hjzbavvirl@ethereal.email');
			console.log('Password: sFy2gYRv7hrnm4RXP1');
		} else {
			console.log('Email was NOT sent. Check error above.');
		}
	} catch (error) {
		console.error('Error sending email:', error);
	}

	await mongoose.disconnect();
	console.log('Disconnected from MongoDB');
}

testEmail().catch(console.error);
