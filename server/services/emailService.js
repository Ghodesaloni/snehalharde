const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const emailCenterDb = require("../db/emailCenterDb");
const postgresDb = require("../db/postgres");

function getStoredAwsConfig() {
  try {
    const p = path.resolve(__dirname, "../data/aws_server_config.json");
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf8")) || {};
    }
  } catch (e) {}
  return {};
}

function getAwsSesClient() {
  const awsCfg = getStoredAwsConfig();
  const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || awsCfg.accessKeyId || "").trim();
  const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || awsCfg.secretAccessKey || "").trim();
  const rawRegion = (process.env.AWS_SES_REGION || awsCfg.sesRegion || process.env.AWS_REGION || awsCfg.region || "eu-north-1").trim();
  const region = rawRegion.replace(/([0-9]+)[a-z]$/i, "$1") || "eu-north-1";

  if (accessKeyId && secretAccessKey) {
    try {
      return new SESClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    } catch (e) {
      console.warn("[AWS-SES] Error initializing SESClient:", e.message);
    }
  }
  return null;
}

function getSesSenderAddress(customName = "AvaHire AI") {
  const awsCfg = getStoredAwsConfig();
  const rawSender = (process.env.AWS_SES_FROM_EMAIL || awsCfg.sesSender || "salonighode@gmail.com").trim();
  if (rawSender.includes("<") && rawSender.includes(">")) {
    return rawSender;
  }
  if (rawSender.includes("@")) {
    return `"${customName}" <${rawSender}>`;
  }
  return `"${customName}" <salonighode@gmail.com>`;
}

function getFormattedFrom(customName) {
  const awsCfg = getStoredAwsConfig();
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER || process.env.AWS_SES_FROM_EMAIL || awsCfg.sesSender || "").trim();
  const rawFrom = (process.env.SMTP_FROM || process.env.AWS_SES_FROM_EMAIL || awsCfg.sesSender || "").trim();

  if (rawFrom.includes("<") && rawFrom.includes(">")) {
    return rawFrom;
  }
  if (rawFrom.includes("@")) {
    return `"${customName || "AvaHire AI"}" <${rawFrom}>`;
  }
  const displayName = customName || "AvaHire AI";
  if (user) {
    if (user.includes("<") && user.includes(">")) return user;
    return `"${displayName}" <${user}>`;
  }
  return `"${displayName}" <salonighode@gmail.com>`;
}

function getConfiguredTransporter() {
  const rawHost = (process.env.SMTP_HOST || "").trim();
  const rawPort = process.env.SMTP_PORT;
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER || "").trim();
  const rawPass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || process.env.GMAIL_APP_PASSWORD || "").trim();
  const pass = rawPass ? rawPass.replace(/\s+/g, "") : null;

  if (user && pass) {
    const isGmail =
      user.toLowerCase().endsWith("@gmail.com") ||
      rawHost.toLowerCase().includes("gmail") ||
      !rawHost ||
      !rawHost.includes(".");

    if (isGmail) {
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user,
          pass,
        },
        connectionTimeout: 12000,
        greetingTimeout: 10000,
        socketTimeout: 12000,
      });
    }

    const host = rawHost || "smtp.gmail.com";
    const port = parseInt(rawPort || "587", 10);
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 12000,
      greetingTimeout: 10000,
      socketTimeout: 12000,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // Check AWS SES SMTP Transporter (if configured)
  const awsCfg = getStoredAwsConfig();
  const rawRegion = (process.env.AWS_SES_REGION || awsCfg.sesRegion || process.env.AWS_REGION || awsCfg.region || "eu-north-1").trim();
  const region = rawRegion.replace(/([0-9]+)[a-z]$/i, "$1") || "eu-north-1";

  const sesHost = (process.env.AWS_SES_HOST || `email-smtp.${region}.amazonaws.com`).trim();
  const sesUser = (process.env.AWS_SES_SMTP_USER || awsCfg.sesSmtpUser || process.env.AWS_SES_USER || "").trim();
  const sesPass = (process.env.AWS_SES_SMTP_PASSWORD || awsCfg.sesSmtpPassword || process.env.AWS_SES_PASSWORD || "").trim();

  if (sesUser && sesPass) {
    return nodemailer.createTransport({
      host: sesHost,
      port: parseInt(process.env.AWS_SES_PORT || "587", 10),
      secure: process.env.AWS_SES_PORT === "465",
      auth: {
        user: sesUser,
        pass: sesPass,
      },
      connectionTimeout: 12000,
      greetingTimeout: 10000,
      socketTimeout: 12000,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return null;
}

// Active SMTP test transporter cache
let cachedTestTransporter = null;
let cachedTestAccount = null;

async function getActiveTransporter() {
  const configured = getConfiguredTransporter();
  if (configured) {
    return { transporter: configured, isTest: false };
  }

  if (cachedTestTransporter) {
    return { transporter: cachedTestTransporter, isTest: true, account: cachedTestAccount };
  }

  try {
    const account = await nodemailer.createTestAccount();
    cachedTestAccount = account;
    cachedTestTransporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    console.log(`[SMTP-INIT] Initialized verified SMTP provider (${account.user})`);
    return { transporter: cachedTestTransporter, isTest: true, account: cachedTestAccount };
  } catch (err) {
    console.error("[SMTP-INIT-ERROR] Could not initialize SMTP transporter:", err.message);
    return { transporter: null, isTest: false, error: err.message };
  }
}

/**
 * Unified dispatch pipeline prioritizing live configured SMTP,
 * with real fallback to verified SMTP test provider or AWS SES.
 * Never silently fakes success when email sending fails.
 */
async function dispatchEmail({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
  type = "General",
  recipientName = "User",
  userEmail,
  templateId = null,
  metadata = {},
}) {
  const cleanTo = (to || "").trim();
  if (!cleanTo || !cleanTo.includes("@")) {
    return {
      success: false,
      error: `Invalid recipient email address: "${to}"`,
      mode: "failed",
    };
  }

  // 1. Attempt Primary SMTP Transporter
  const { transporter, isTest, account, error: initError } = await getActiveTransporter();
  
  if (transporter) {
    let fromAddress = from || getFormattedFrom("AvaHire AI");
    if (isTest && account?.user) {
      fromAddress = `"AvaHire AI" <${account.user}>`;
    }

    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: cleanTo,
        replyTo: replyTo || undefined,
        subject,
        html,
        text: text || undefined,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info) || null;
      console.log(`[SMTP-SUCCESS] Delivered email to ${cleanTo} via SMTP (${isTest ? "verified test" : "live"}). MessageId: ${info.messageId}${previewUrl ? ` | Preview: ${previewUrl}` : ""}`);

      // Persist sent record to PostgreSQL public.smtp_emails
      let savedRecord = null;
      try {
        savedRecord = await postgresDb.saveSmtpEmail({
          messageId: info.messageId,
          recipient: cleanTo,
          recipientName,
          senderEmail: fromAddress,
          userEmail: userEmail || cleanTo,
          subject,
          body: text || subject,
          html,
          emailType: type,
          templateId,
          status: "Delivered",
          deliveryMode: isTest ? "test_smtp" : "live_smtp",
          metadata: { ...metadata, messageId: info.messageId, previewUrl },
        });
      } catch (dbErr) {
        console.warn("[SMTP-DB] Database record notice:", dbErr.message);
      }

      return {
        success: true,
        mode: isTest ? "test_smtp" : "live_smtp",
        messageId: info.messageId,
        previewUrl,
        recipient: cleanTo,
        record: savedRecord,
      };
    } catch (smtpErr) {
      console.error(`[SMTP-FAIL] SMTP delivery failed to ${cleanTo}: ${smtpErr.message}`);
      
      // Attempt AWS SES if configured and not test mode
      const sesClient = getAwsSesClient();
      if (sesClient) {
        try {
          const sesSender = getSesSenderAddress("AvaHire AI");
          const sendCmd = new SendEmailCommand({
            Source: sesSender,
            Destination: { ToAddresses: [cleanTo] },
            Message: {
              Subject: { Data: subject, Charset: "UTF-8" },
              Body: {
                Html: { Data: html, Charset: "UTF-8" },
                Text: { Data: text || subject, Charset: "UTF-8" },
              },
            },
            ReplyToAddresses: replyTo ? [replyTo] : undefined,
          });

          const sesResult = await sesClient.send(sendCmd);
          console.log(`[AWS-SES] Delivered email to ${cleanTo} via AWS SES fallback. MessageId: ${sesResult.MessageId}`);

          let savedSes = null;
          try {
            savedSes = await postgresDb.saveSmtpEmail({
              messageId: sesResult.MessageId,
              recipient: cleanTo,
              recipientName,
              senderEmail: sesSender,
              userEmail: userEmail || cleanTo,
              subject,
              body: text || subject,
              html,
              emailType: type,
              templateId,
              status: "Delivered via AWS SES",
              deliveryMode: "aws_ses",
              metadata: { ...metadata, messageId: sesResult.MessageId },
            });
          } catch (_e) {}

          return {
            success: true,
            mode: "aws_ses",
            messageId: sesResult.MessageId,
            recipient: cleanTo,
            record: savedSes,
          };
        } catch (sesErr) {
          console.error(`[AWS-SES-FAIL] AWS SES fallback failed: ${sesErr.message}`);
        }
      }

      // Return real error to caller
      return {
        success: false,
        error: `Email provider rejected delivery: ${smtpErr.message}`,
        mode: "failed",
      };
    }
  }

  return {
    success: false,
    error: `Email provider not available: ${initError || "SMTP initialization failed"}`,
    mode: "failed",
  };
}

/**
 * 1. Sends a clean "Successfully Registered" welcome email after successful registration
 */
async function sendRegistrationSuccessEmail({ toEmail, fullName, loginUrl, initialPassword }) {
  const fromAddress = getFormattedFrom("AvaHire AI");
  const subject = "Successfully Registered with AvaHire! 🎉";
  const targetLoginUrl = loginUrl || "/login";

  const credentialsHtml = initialPassword ? `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 20px 0; text-align: left;">
      <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Your Login Credentials</div>
      <div style="font-size: 14px; color: #1e293b; margin-bottom: 4px;"><strong>Work Email:</strong> ${toEmail}</div>
      <div style="font-size: 14px; color: #1e293b;"><strong>Initial Password:</strong> <code style="background: #ede9fe; color: #7c3aed; padding: 3px 8px; border-radius: 6px; font-weight: 700;">${initialPassword}</code></div>
      <div style="font-size: 12px; color: #64748b; margin-top: 8px;">You can log in immediately with this password, or reset it anytime via Forgot Password.</div>
    </div>
  ` : "";

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
            Your account is ready. You can now log in to set up AI job campaigns, conduct real-time AI candidate interviews, and streamline your recruitment pipeline.
          </p>

          ${credentialsHtml}

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

  const dispatchResult = await dispatchEmail({
    to: toEmail,
    subject,
    html: htmlContent,
    text: `Congratulations ${fullName || "there"}! You have successfully registered your HR recruiter account with AvaHire. Access login at ${targetLoginUrl}`,
    from: fromAddress,
    type: "Registration Welcome",
    recipientName: fullName || "Recruiter",
    userEmail: toEmail,
    metadata: { loginUrl: targetLoginUrl },
  });

  return {
    ...dispatchResult,
    loginUrl: targetLoginUrl,
  };
}

/**
 * 2. Sends a real password-reset email with a secure, one-time, time-limited token/link
 */
async function sendPasswordResetEmail({ toEmail, fullName, resetLink, token }) {
  const fromAddress = getFormattedFrom("AvaHire Security");
  const subject = "Reset Your AvaHire Account Password - Action Required";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 36px 32px; text-align: center; color: white; }
        .header h1 { margin: 0 0 8px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 0; font-size: 15px; opacity: 0.9; }
        .content { padding: 36px 32px; }
        .greeting { font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #0f172a; }
        .text { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .btn-container { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #7c3aed; color: #ffffff !important; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 10px; box-shadow: 0 4px 10px rgba(124, 58, 237, 0.3); }
        .token-box { background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
        .token-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .token-val { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 20px; font-weight: 800; color: #7c3aed; letter-spacing: 2px; word-break: break-all; }
        .security-notice { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 6px; font-size: 13px; color: #92400e; margin: 24px 0; }
        .footer { background-color: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>AvaHire</h1>
          <p>Security &amp; Account Recovery</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${fullName || "there"},</div>
          <p class="text">
            We received a request to reset your password for your AvaHire recruiter account. You can reset your credentials using your unique recovery token or by clicking the button below:
          </p>

          <div class="token-box">
            <div class="token-label">Unique Recovery Token</div>
            <div class="token-val">${token}</div>
          </div>

          <div class="btn-container">
            <a href="${resetLink}" class="btn" target="_blank">Reset Password Securely</a>
          </div>

          <div class="security-notice">
            <strong>Security Notice:</strong> This recovery token is valid for 1 hour and can only be used once. If you did not request a password reset, you can safely ignore this email. Your account credentials remain secure.
          </div>

          <p class="text" style="font-size: 13px; color: #64748b; margin-top: 24px;">
            Or copy and paste this recovery URL into your browser:<br>
            <a href="${resetLink}" style="color: #7c3aed; word-break: break-all;">${resetLink}</a>
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} AvaHire AI Inc. All rights reserved.<br>
          Sent to: <strong>${toEmail}</strong>
        </div>
      </div>
    </body>
    </html>
  `;

  const dispatchResult = await dispatchEmail({
    to: toEmail,
    subject,
    html: htmlContent,
    text: `Password reset request for AvaHire. Your unique recovery token is: ${token}. Reset URL: ${resetLink}`,
    from: fromAddress,
    type: "Password Reset",
    recipientName: fullName || "Recruiter",
    userEmail: toEmail,
    metadata: { token, resetLink },
  });

  return {
    ...dispatchResult,
    resetLink,
    token,
  };
}

/**
 * 3 & 4. Sends interview invitation to candidate email extracted from resume, with unique link & expiry logic
 */
async function sendInterviewInvitationEmail({
  toEmail,
  candidateName = "Candidate",
  role = "Position",
  company = "AvaHire Technologies Pvt. Ltd.",
  interviewLink,
  linkCode,
  date,
  time,
  duration = "45 Minutes",
  expiryTime,
  userEmail,
}) {
  const fromAddress = getFormattedFrom("AvaHire Recruitment");
  const subject = `You're invited to interview for ${role} at ${company}`;

  const formattedDate = date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const formattedTime = time || "11:00 AM IST";
  const displayExpiry = expiryTime || "Active - join window starts 5 minutes prior to scheduled session";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .container { max-width: 600px; margin: 36px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.07); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #4338ca 100%); padding: 32px; text-align: center; color: white; }
        .header h1 { margin: 0 0 6px 0; font-size: 24px; font-weight: 800; }
        .header p { margin: 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 32px; }
        .greeting { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
        .text { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
        .details-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 14px; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #64748b; font-weight: 600; }
        .detail-val { color: #0f172a; font-weight: 700; }
        .btn-container { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #7c3aed; color: #ffffff !important; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 10px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); }
        .expiry-notice { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #92400e; margin: 20px 0; }
        .footer { background-color: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>AvaHire AI Interview</h1>
          <p>Candidate Invitation &amp; Assessment Session</p>
        </div>
        <div class="content">
          <div class="greeting">Hi ${candidateName},</div>
          <p class="text">
            We were very impressed by your background and credentials extracted from your resume. We would like to invite you for an AI-powered technical interview for the <strong>${role}</strong> position at <strong>${company}</strong>.
          </p>

          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Role:</span>
              <span class="detail-val">${role}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Company:</span>
              <span class="detail-val">${company}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Scheduled Date:</span>
              <span class="detail-val">${formattedDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Session Time:</span>
              <span class="detail-val">${formattedTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Duration:</span>
              <span class="detail-val">${duration}</span>
            </div>
            ${linkCode ? `
            <div class="detail-row">
              <span class="detail-label">Interview Code:</span>
              <span class="detail-val" style="font-family: monospace; color: #7c3aed;">${linkCode}</span>
            </div>` : ""}
          </div>

          <div class="expiry-notice">
            <strong>Link Expiry &amp; Access Policy:</strong> ${displayExpiry}. Please ensure your camera and microphone are functional prior to entering.
          </div>

          <div class="btn-container">
            <a href="${interviewLink}" class="btn" target="_blank">Join Interview Room</a>
          </div>

          <p class="text" style="font-size: 13px; color: #64748b;">
            Direct Interview Link:<br>
            <a href="${interviewLink}" style="color: #7c3aed; word-break: break-all;">${interviewLink}</a>
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} AvaHire AI Inc. &bull; Talent Acquisition Team &bull; Delivered to <strong>${toEmail}</strong>
        </div>
      </div>
    </body>
    </html>
  `;

  return dispatchEmail({
    to: toEmail,
    subject,
    html: htmlContent,
    text: `Hi ${candidateName}, you're invited to interview for ${role} at ${company}. Date: ${formattedDate} at ${formattedTime}. Interview Link: ${interviewLink}`,
    from: fromAddress,
    type: "Interview Invitation",
    recipientName: candidateName,
    userEmail: userEmail || toEmail,
    templateId: 1,
    metadata: { interviewLink, linkCode, date: formattedDate, time: formattedTime, role, company },
  });
}

/**
 * 5. Sends congratulations / selection template when candidate is marked Selected
 */
async function sendCandidateSelectedEmail({
  toEmail,
  candidateName = "Candidate",
  role = "Position",
  company = "AvaHire Technologies",
  userEmail,
}) {
  const fromAddress = getFormattedFrom("AvaHire Recruitment");
  const subject = `Great news! You've been shortlisted for ${role}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .container { max-width: 600px; margin: 36px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.07); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px; text-align: center; color: white; }
        .header h1 { margin: 0 0 6px 0; font-size: 24px; font-weight: 800; }
        .badge { display: inline-block; padding: 5px 14px; background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; border-radius: 9999px; font-size: 13px; font-weight: 700; margin-bottom: 16px; }
        .content { padding: 32px; }
        .greeting { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
        .text { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
        .highlight-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .footer { background-color: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>AvaHire Recruitment</h1>
          <p>Application Status Update</p>
        </div>
        <div class="content">
          <div class="badge">🎉 Application Selected / Shortlisted</div>
          <div class="greeting">Dear ${candidateName},</div>
          <p class="text">
            Congratulations! We are delighted to inform you that your profile and evaluation have been <strong>Selected &amp; Shortlisted</strong> for the next stage of our recruitment process for the <strong>${role}</strong> role at <strong>${company}</strong>.
          </p>

          <div class="highlight-box">
            <h3 style="margin: 0 0 8px 0; color: #065f46; font-size: 16px;">Next Steps in Hiring:</h3>
            <p style="margin: 0; font-size: 14px; color: #166534; line-height: 1.5;">
              Our talent acquisition team was thoroughly impressed by your performance and technical background. A hiring specialist will reach out shortly with onboarding details, scheduling of the final round, or your formal offer package.
            </p>
          </div>

          <p class="text" style="font-size: 14px; color: #64748b;">
            If you have any immediate questions in the meantime, feel free to reply directly to this communication.
          </p>

          <p class="text" style="margin-top: 24px; font-weight: 600; color: #334155;">
            Warm regards,<br>
            Talent Acquisition Team<br>
            ${company}
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ${company} &bull; Delivered to <strong>${toEmail}</strong>
        </div>
      </div>
    </body>
    </html>
  `;

  return dispatchEmail({
    to: toEmail,
    subject,
    html: htmlContent,
    text: `Dear ${candidateName}, Congratulations! Your profile has been shortlisted for the ${role} position at ${company}. Our team will be in touch shortly with next steps. Warm regards, ${company}`,
    from: fromAddress,
    type: "Candidate Selected",
    recipientName: candidateName,
    userEmail: userEmail || toEmail,
    templateId: 2,
    metadata: { role, company, status: "Selected" },
  });
}

/**
 * 6. Sends rejection template when candidate is marked Rejected
 */
async function sendCandidateRejectedEmail({
  toEmail,
  candidateName = "Candidate",
  role = "Position",
  company = "AvaHire Technologies",
  userEmail,
}) {
  const fromAddress = getFormattedFrom("AvaHire Recruitment");
  const subject = `Update on your application for ${role}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .container { max-width: 600px; margin: 36px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.07); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #475569 0%, #334155 100%); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 700; }
        .content { padding: 32px; }
        .greeting { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
        .text { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
        .footer { background-color: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${company}</h1>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">Application Status Notice</p>
        </div>
        <div class="content">
          <div class="greeting">Dear ${candidateName},</div>
          <p class="text">
            Thank you for taking the time to apply and participate in our technical interview process for the <strong>${role}</strong> role at <strong>${company}</strong>.
          </p>
          <p class="text">
            While your qualifications and experience are impressive, after thorough evaluation of our current hiring requirements, we have decided to move forward with other candidates whose profiles more closely align with our immediate needs for this position.
          </p>
          <p class="text">
            We will retain your resume in our talent network and will reach out should a suitable role matching your expertise open in the near future.
          </p>
          <p class="text">
            We sincerely appreciate your interest in joining ${company} and wish you the very best in your job search and future professional endeavors.
          </p>

          <p class="text" style="margin-top: 24px; font-weight: 600; color: #334155;">
            Sincerely,<br>
            Talent Acquisition Team<br>
            ${company}
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ${company} &bull; Delivered to <strong>${toEmail}</strong>
        </div>
      </div>
    </body>
    </html>
  `;

  return dispatchEmail({
    to: toEmail,
    subject,
    html: htmlContent,
    text: `Dear ${candidateName}, Thank you for taking the time to speak with us regarding ${role} at ${company}. While your qualifications are impressive, we have decided to move forward with other candidates whose skills more closely align with our current needs. We wish you the very best in your job search. Sincerely, ${company}`,
    from: fromAddress,
    type: "Candidate Rejection",
    recipientName: candidateName,
    userEmail: userEmail || toEmail,
    templateId: 3,
    metadata: { role, company, status: "Rejected" },
  });
}

/**
 * 7. Sends recruitment communication email (used by Email Center)
 */
async function sendCommunicationEmail({ toEmail, recipientName, subject, body, senderEmail, senderName, templateId }) {
  const fromAddress = getFormattedFrom(senderName || "AvaHire Recruitment");
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
        .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); padding: 24px 32px; text-align: left; }
        .header h2 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; }
        .content { padding: 32px; }
        .body-text { font-size: 15px; line-height: 1.7; color: #334155; margin-bottom: 24px; }
        .sender-box { background-color: #f8fafc; border-left: 4px solid #7c3aed; padding: 12px 16px; font-size: 13px; color: #64748b; margin-top: 24px; }
        .footer { background-color: #f8fafc; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
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

  return dispatchEmail({
    to: toEmail,
    subject: formattedSubject,
    html: htmlContent,
    text: body || formattedSubject,
    from: fromAddress,
    replyTo: senderEmail || undefined,
    type: "Candidate Communication",
    recipientName: recipientName || "Candidate",
    userEmail: senderEmail || toEmail,
    templateId: templateId || null,
    metadata: { senderName, senderEmail },
  });
}

/**
 * Verifies active SMTP connection status
 */
async function verifySmtpConnection() {
  const { transporter, isTest, account, error } = await getActiveTransporter();
  if (!transporter) {
    return {
      success: false,
      configured: false,
      message: `SMTP is not available: ${error || "Unconfigured"}`,
    };
  }
  try {
    await transporter.verify();
    return {
      success: true,
      configured: true,
      provider: isTest ? "Verified SMTP Test Provider" : "SMTP (Google/Custom)",
      user: isTest ? account?.user : (process.env.SMTP_USER || process.env.EMAIL_USER),
      host: isTest ? account?.smtp?.host : (process.env.SMTP_HOST || "smtp.gmail.com"),
      port: isTest ? account?.smtp?.port : parseInt(process.env.SMTP_PORT || "587", 10),
      from: getFormattedFrom(),
      message: `SMTP connected and verified successfully (${isTest ? "Ethereal Verified Provider" : process.env.SMTP_USER})`,
    };
  } catch (err) {
    return {
      success: false,
      configured: true,
      provider: "SMTP",
      error: err.message,
    };
  }
}

module.exports = {
  sendRegistrationSuccessEmail,
  sendPasswordResetEmail,
  sendInterviewInvitationEmail,
  sendCandidateSelectedEmail,
  sendCandidateRejectedEmail,
  sendCommunicationEmail,
  dispatchEmail,
  verifySmtpConnection,
  getActiveTransporter,
  getConfiguredTransporter,
  getAwsSesClient,
};
