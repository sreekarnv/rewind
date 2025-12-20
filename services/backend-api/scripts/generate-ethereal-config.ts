import nodemailer from 'nodemailer';

async function generateEtherealConfig() {
  console.log('Generating Ethereal Email test account...\n');

  try {
    const testAccount = await nodemailer.createTestAccount();

    console.log('✓ Ethereal Email account created!\n');
    console.log('Copy these lines to your .env file:\n');
    console.log('EMAIL_ENABLED=true');
    console.log(`EMAIL_SMTP_HOST=${testAccount.smtp.host}`);
    console.log(`EMAIL_SMTP_PORT=${testAccount.smtp.port}`);
    console.log('EMAIL_SMTP_SECURE=false');
    console.log(`EMAIL_SMTP_USER=${testAccount.user}`);
    console.log(`EMAIL_SMTP_PASS=${testAccount.pass}`);
    console.log('EMAIL_FROM=Rewind Alerts <noreply@rewind.local>');
    console.log('EMAIL_RECIPIENT=test@example.com');
    console.log('EMAIL_RETRY_ATTEMPTS=3');
    console.log('EMAIL_RETRY_DELAY=2000');
    console.log('FRONTEND_URL=http://localhost:5173');
    console.log('\n');
    console.log('Web Interface:');
    console.log(`URL: ${testAccount.web}`);
    console.log('Username:', testAccount.user);
    console.log('Password:', testAccount.pass);
    console.log('\n✓ Visit the web interface above to view sent emails!');
  } catch (error) {
    console.error('Failed to create Ethereal account:', error);
    process.exit(1);
  }
}

generateEtherealConfig();
