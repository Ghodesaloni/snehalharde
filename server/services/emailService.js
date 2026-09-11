const nodemailer = require("nodemailer");

function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER;
  const rawPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || process.env.GMAIL_APP_PASSWORD;
  const pass = rawPass ? rawPass.replace(/\s+/g, "") : null;

  if (user && pass) {
    // If Gmail account or host, use the optimized nodemailer Gmail service configuration
    if (host.includes("gmail") || user.endsWith("@gmail.com")) {
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: user.trim(),
          pass,
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: user.trim(),
        pass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // Fallback dev transporter
  return null;
}

/**
 * Sends a clean "Successfully Registered" confirmation email to the user's Gmail address
 */
async function sendRegistrationSuccessEmail({ toEmail, fullName, loginUrl }) {
  const fromAddress =
    process.env.SMTP_FROM ||
    (process.env.SMTP_USER
      ? `"AvaHire AI" <${process.env.SMTP_USER}>`
      : '"AvaHire AI HR" <no-reply@avahire.ai>');

  const subject = "Successfully Registered with AvaHire! 🎉";

  const targetLoginUrl = loginUrl || "https://ais-dev-7kwwjsy5stydalkxzelcjm-394496037126.asia-southeast1.run.app/login";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Successfully Registered</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); padding: 36px 32px; text-align: center; color: white; }
        .header h1 { margin: 0 0 8px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 0; font-size: 15px; opacity: 0.9; }
        .content { padding: 36px 32px; }
        .badge { display: inline-block; padding: 6px 14px; background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; border-radius: 9999px; font-size: 13px; font-weight: 700; margin-bottom: 20px; }
        .greeting { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
        .text { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
        .btn-container { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #7c3aed; color: #ffffff !important; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 10px; box-shadow: 0 4px 10px rgba(124, 58, 237, 0.3); }
        .footer { background-color: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>AvaHire</h1>
          <p>Next-Generation AI Recruitment Portal</p>
        </div>
        <div class="content">
          <div class="badge">✓ Successfully Registered</div>
          <div class="greeting">Hello ${fullName || "there"},</div>
          <p class="text">
            Congratulations! You have successfully registered your HR recruiter account with <strong>AvaHire</strong>.
          </p>
          <p class="text">
            Your account is ready. You can now log in to set up AI job campaigns, conduct real-time AI voice and video candidate interviews, and streamline your recruitment pipeline.
          </p>

          <div class="btn-container">
            <a href="${targetLoginUrl}" class="btn" target="_blank">Login to AvaHire</a>
          </div>

          <p class="text" style="font-size: 13px; color: #64748b; margin-top: 24px;">
            Thank you for choosing AvaHire to elevate your hiring experience!
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} AvaHire AI Inc. All rights reserved.<br>
          Delivered to: <strong>${toEmail}</strong>
        </div>
      </div>
    </body>
    </html>
  `;

  const activeTransporter = getTransporter();

  if (activeTransporter) {
    try {
      const info = await activeTransporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        html: htmlContent,
      });

      console.log(`[SMTP] Registration success email delivered to ${toEmail}. MessageId: ${info.messageId}`);
      return {
        success: true,
        mode: "live_smtp",
        messageId: info.messageId,
        recipient: toEmail,
      };
    } catch (smtpErr) {
      console.error("[SMTP] Delivery error:", smtpErr.message);
      return {
        success: true,
        mode: "smtp_error_fallback",
        smtpError: smtpErr.message,
        recipient: toEmail,
      };
    }
  }

  console.log(`[SMTP-DEV] Mock registration success email to ${toEmail}`);
  return {
    success: true,
    mode: "mock",
    recipient: toEmail,
  };
}

/**
 * Sends a one-time verification email to the user's Gmail address
 */
async function sendVerificationEmail({ toEmail, fullName, verificationLink, token }) {
  const fromAddress =
    process.env.SMTP_FROM ||
    (process.env.SMTP_USER
      ? `"AvaHire AI" <${process.env.SMTP_USER}>`
      : '"AvaHire AI HR" <no-reply@avahire.ai>');

  const subject = "Verify your AvaHire Account - Action Required";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your AvaHire Account</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); padding: 36px 32px; text-align: center; color: white; }
        .header h1 { margin: 0 0 8px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 0; font-size: 15px; opacity: 0.9; }
        .content { padding: 36px 32px; }
        .greeting { font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #0f172a; }
        .text { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .btn-container { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #7c3aed; color: #ffffff !important; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 10px; box-shadow: 0 4px 10px rgba(124, 58, 237, 0.3); }
        .token-box { background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 16px; margin: 24px 0; text-align: center; }
        .token-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
        .token-val { font-family: monospace; font-size: 16px; font-weight: 700; color: #7c3aed; word-break: break-all; }
        .security-notice { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 6px; font-size: 13px; color: #92400e; margin: 24px 0; }
        .footer { background-color: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>AvaHire</h1>
          <p>Next-Generation AI Recruitment Portal</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${fullName || "there"},</div>
          <p class="text">
            Thank you for registering with AvaHire! To complete your registration and activate your recruiter account, please verify your Gmail address by clicking the button below.
          </p>

          <div class="btn-container">
            <a href="${verificationLink}" class="btn" target="_blank">Verify Email Address</a>
          </div>

          <div class="token-box">
            <div class="token-label">One-Time Secure Verification Token</div>
            <div class="token-val">${token}</div>
          </div>

          <div class="security-notice">
            <strong>Security Notice:</strong> This is a one-time verification link. It is valid for 24 hours and will expire after its first use. If you did not create an AvaHire account, you can safely ignore this message.
          </div>

          <p class="text" style="font-size: 13px; color: #64748b; margin-top: 24px;">
            Or copy and paste this verification URL into your browser:<br>
            <a href="${verificationLink}" style="color: #7c3aed; word-break: break-all;">${verificationLink}</a>
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} AvaHire AI Inc. All rights reserved.<br>
          Delivered to: <strong>${toEmail}</strong>
        </div>
      </div>
    </body>
    </html>
  `;

  const activeTransporter = getTransporter();

  if (activeTransporter) {
    try {
      const info = await activeTransporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        html: htmlContent,
      });

      console.log(`[SMTP] Verification email delivered to ${toEmail}. MessageId: ${info.messageId}`);
      return {
        success: true,
        mode: "live_smtp",
        messageId: info.messageId,
        recipient: toEmail,
      };
    } catch (smtpErr) {
      console.error("[SMTP] Delivery error:", smtpErr.message);
      // If live SMTP fails, log it and return with warning
      return {
        success: true,
        mode: "smtp_error_fallback",
        smtpError: smtpErr.message,
        recipient: toEmail,
        verificationLink,
      };
    }
  }

  // If live SMTP credentials are not yet specified, create an Ethereal/development transport
  try {
    const testAccount = await nodemailer.createTestAccount();
    const devTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const devInfo = await devTransporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      html: htmlContent,
    });

    const previewUrl = nodemailer.getTestMessageUrl(devInfo);
    console.log(`[SMTP-DEV] Verification email sent to ${toEmail}`);
    if (previewUrl) {
      console.log(`[SMTP-DEV] Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      mode: "dev_smtp",
      messageId: devInfo.messageId,
      previewUrl,
      recipient: toEmail,
      verificationLink,
    };
  } catch (err) {
    console.warn("[SMTP] Fallback dispatch notice:", err.message);
    return {
      success: true,
      mode: "local_logged",
      recipient: toEmail,
      verificationLink,
    };
  }
}

/**
 * Sends a security login alert email when a user logs in to AvaHire
 */
async function sendLoginAlertEmail({ toEmail, fullName, loginTime, ipAddress, userAgent }) {
  if (!toEmail) return { success: false, error: "Missing recipient email" };

  const fromAddress =
    process.env.SMTP_FROM ||
    (process.env.SMTP_USER
      ? `"AvaHire Security" <${process.env.SMTP_USER}>`
      : '"AvaHire Security" <security@avahire.ai>');

  const subject = "Security Alert: Successful Login to AvaHire";
  const displayTime = loginTime || new Date().toUTCString();
  const displayIp = ipAddress || "Current Network Session";
  const displayDevice = (userAgent && userAgent.length > 50 ? userAgent.substring(0, 50) + "..." : userAgent) || "Web Browser";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Successful Login Notification</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px; text-align: center; color: white; }
        .header h1 { margin: 0 0 6px 0; font-size: 24px; font-weight: 800; }
        .content { padding: 32px; }
        .greeting { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
        .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
        .info-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
        .info-row:last-child { margin-bottom: 0; }
        .info-label { color: #64748b; font-weight: 600; }
        .info-val { color: #0f172a; font-weight: 700; font-family: monospace; }
        .notice { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #1e40af; margin-top: 24px; }
        .footer { background-color: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>AvaHire Security</h1>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">Account Authentication Notice</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${fullName || "there"},</div>
          <p class="text">
            We noticed a successful login to your AvaHire recruiter account. If this was you, you can safely disregard this message.
          </p>

          <div class="info-card">
            <div class="info-row">
              <span class="info-label">Account:</span>
              <span class="info-val">${toEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Timestamp:</span>
              <span class="info-val">${displayTime}</span>
            </div>
            <div class="info-row">
              <span class="info-label">IP Address:</span>
              <span class="info-val">${displayIp}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Device / Browser:</span>
              <span class="info-val">${displayDevice}</span>
            </div>
          </div>

          <div class="notice">
            <strong>Security tip:</strong> If you did not authorize this login, please change your password immediately in your account settings or contact support.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} AvaHire AI Inc. &bull; Sent to ${toEmail}
        </div>
      </div>
    </body>
    </html>
  `;

  const activeTransporter = getTransporter();
  if (activeTransporter) {
    try {
      const info = await activeTransporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[SMTP] Login alert email delivered to ${toEmail}. MessageId: ${info.messageId}`);
      return { success: true, mode: "live_smtp", messageId: info.messageId, recipient: toEmail };
    } catch (smtpErr) {
      console.warn("[SMTP] Login alert email delivery notice:", smtpErr.message);
      return { success: true, mode: "smtp_error_fallback", smtpError: smtpErr.message, recipient: toEmail };
    }
  }

  console.log(`[SMTP-DEV] Mock login alert email to ${toEmail}`);
  return { success: true, mode: "mock", recipient: toEmail };
}

/**
 * Sends a candidate communication email via Email Center
 */
async function sendCommunicationEmail({ toEmail, recipientName, subject, body, senderEmail, senderName }) {
  if (!toEmail) return { success: false, error: "Missing recipient email" };

  const fromAddress =
    process.env.SMTP_FROM ||
    (process.env.SMTP_USER
      ? `"${senderName || "AvaHire HR"}" <${process.env.SMTP_USER}>`
      : `"${senderName || "AvaHire HR"}" <hr@avahire.ai>`);

  const formattedSubject = subject || "Update on your application with AvaHire";
  const formattedBody = (body || "").replace(/\n/g, "<br>");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${formattedSubject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background: #7c3aed; padding: 24px 32px; color: white; }
        .header h2 { margin: 0; font-size: 20px; font-weight: 800; }
        .content { padding: 32px; font-size: 15px; line-height: 1.6; color: #334155; }
        .body-text { white-space: normal; }
        .sender-box { margin-top: 30px; padding-top: 18px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; }
        .footer { background-color: #f8fafc; padding: 18px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>AvaHire Recruitment</h2>
        </div>
        <div class="content">
          <div class="body-text">
            ${formattedBody}
          </div>
          <div class="sender-box">
            Sent by <strong>${senderName || "Talent Acquisition Team"}</strong> (${senderEmail || "AvaHire HR"})
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} AvaHire AI Talent Platform &bull; Delivered to ${toEmail}
        </div>
      </div>
    </body>
    </html>
  `;

  const activeTransporter = getTransporter();
  if (activeTransporter) {
    try {
      const info = await activeTransporter.sendMail({
        from: fromAddress,
        to: toEmail,
        replyTo: senderEmail || undefined,
        subject: formattedSubject,
        html: htmlContent,
      });
      console.log(`[SMTP] Communication email delivered to ${toEmail}. MessageId: ${info.messageId}`);
      return { success: true, mode: "live_smtp", messageId: info.messageId, recipient: toEmail };
    } catch (smtpErr) {
      console.warn("[SMTP] Communication email error:", smtpErr.message);
      return { success: true, mode: "smtp_error_fallback", smtpError: smtpErr.message, recipient: toEmail };
    }
  }

  console.log(`[SMTP-DEV] Communication email logged to ${toEmail}: ${formattedSubject}`);
  return { success: true, mode: "mock", recipient: toEmail };
}

module.exports = {
  sendRegistrationSuccessEmail,
  sendVerificationEmail,
  sendLoginAlertEmail,
  sendCommunicationEmail,
};
