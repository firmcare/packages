import nodemailer from "nodemailer";
import { prisma } from "./prisma";
import { fmtNgn } from "./format";

export type EmailType =
  | "verification"
  | "welcome"
  | "booking_confirmed"
  | "booking_reminder"
  | "booking_status_update"
  | "results_ready"
  | "password_reset"
  | "agent_approved"
  | "agent_rejected"
  | "general";

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

async function getSmtpConfig(): Promise<SmtpConfig> {
  const keys = ["smtp_host", "smtp_port", "smtp_user", "smtp_from_name", "smtp_from_email"];
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: keys } } });
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const host = s.smtp_host || process.env.SMTP_HOST || "";
  const port = parseInt(s.smtp_port || process.env.SMTP_PORT || "587", 10);
  return {
    host,
    port,
    secure: port === 465,
    user: s.smtp_user || process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    fromName: s.smtp_from_name || process.env.SMTP_FROM_NAME || "FirmCare Diagnostics",
    fromEmail: s.smtp_from_email || process.env.SMTP_FROM_EMAIL || s.smtp_user || process.env.SMTP_USER || "",
  };
}

function createTransporter(cfg: SmtpConfig) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
}

// ─── HTML template helpers ──────────────────────────────────────────────────

function baseHtml(title: string, preheader: string, body: string, unsubscribeUrl?: string | null): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<style>
  body{margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}
  .wrapper{max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07);}
  .header{background:#A44692;padding:28px 40px;text-align:center;}
  .header img{display:block;margin:0 auto 12px;height:52px;width:auto;}
  .header h1{margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:.3px;}
  .header p{margin:6px 0 0;color:rgba(255,255,255,.8);font-size:13px;}
  .body{padding:36px 40px;}
  .body p{color:#444;font-size:15px;line-height:1.7;margin:0 0 16px;}
  .body h2{color:#1a1a2e;font-size:18px;margin:0 0 12px;}
  .btn{display:inline-block;margin:20px 0;padding:14px 32px;background:#A44692;color:#fff!important;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;}
  .info-box{background:#f9f0f7;border-left:4px solid #A44692;border-radius:8px;padding:16px 20px;margin:20px 0;}
  .info-box p{margin:4px 0;font-size:14px;color:#555;}
  .info-box .label{font-weight:700;color:#A44692;font-size:12px;text-transform:uppercase;letter-spacing:.5px;}
  .footer{background:#f4f4f7;padding:24px 40px;text-align:center;}
  .footer p{color:#999;font-size:12px;margin:4px 0;line-height:1.6;}
  .divider{height:1px;background:#f0e8f0;margin:24px 0;}
</style>
</head>
<body>
<span style="display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden;">${preheader}&nbsp;</span>
<div class="wrapper">
  <div class="header">
    <img src="${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/logo.png" alt="FirmCare Diagnostics" />
    <h1>FirmCare Diagnostics</h1>
    <p>Your trusted health screening partner</p>
  </div>
  <div class="body">${body}</div>
  <div class="footer">
    <p>FirmCare Diagnostics &bull; Abuja, Nigeria</p>
    <p>Need help? <a href="mailto:info@firmcare.com.ng" style="color:#A44692;">info@firmcare.com.ng</a> &bull; +234-808-874-3272</p>
    <p style="margin-top:12px;color:#bbb;font-size:11px;">This email was sent to you because you have an account with FirmCare.</p>
    ${unsubscribeUrl ? `<p style="margin-top:8px;font-size:11px;color:#ccc;">Don't want to receive promotional emails? <a href="${unsubscribeUrl}" style="color:#bbb;text-decoration:underline;">Unsubscribe</a></p>` : ""}
  </div>
</div>
</body>
</html>`;
}

// ─── Email senders ──────────────────────────────────────────────────────────

async function logEmail(
  to: string,
  subject: string,
  type: EmailType,
  status: "sent" | "failed",
  error?: string
) {
  try {
    await prisma.emailLog.create({ data: { to, subject, type, status, error } });
  } catch {
    // non-fatal
  }
}

interface SendResult {
  success: boolean;
  error?: string;
}

export async function sendVerificationEmail(
  to: string,
  name: string | null | undefined,
  token: string,
  baseUrl: string,
  callbackUrl?: string
): Promise<SendResult> {
  const cfg = await getSmtpConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    return { success: false, error: "SMTP not configured" };
  }

  const link = `${baseUrl}/auth/verify-email?token=${token}${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`;
  const subject = "Verify your FirmCare account";
  const body = `
    <h2>Welcome to FirmCare${name ? `, ${name}` : ""}!</h2>
    <p>Thanks for signing up. Please verify your email address to activate your account and start booking health screenings.</p>
    <p style="text-align:center;"><a href="${link}" class="btn">Verify My Email</a></p>
    <p style="font-size:13px;color:#888;">Or copy and paste this link into your browser:<br/>
    <a href="${link}" style="color:#A44692;word-break:break-all;">${link}</a></p>
    <div class="divider"></div>
    <p style="font-size:13px;color:#999;">This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.</p>
  `;

  try {
    const transporter = createTransporter(cfg);
    await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to,
      subject,
      html: baseHtml(subject, "Verify your email to get started", body),
    });
    await logEmail(to, subject, "verification", "sent");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEmail(to, subject, "verification", "failed", msg);
    return { success: false, error: msg };
  }
}

export async function sendWelcomeEmail(
  to: string,
  name: string | null | undefined,
  referralCode: string,
  baseUrl: string
): Promise<SendResult> {
  const cfg = await getSmtpConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    return { success: false, error: "SMTP not configured" };
  }

  const dashboardLink = `${baseUrl}/dashboard`;
  const subject = "Welcome to FirmCare — Your Account is Ready!";
  const body = `
    <h2>Your account is verified${name ? `, ${name}` : ""}!</h2>
    <p>Welcome to FirmCare Diagnostics. Your account is now active and ready to use. Start booking health screenings and take control of your wellness today.</p>
    <div class="info-box">
      <p class="label">Your Referral Code</p>
      <p style="font-size:22px;font-weight:800;color:#A44692;letter-spacing:2px;">${referralCode}</p>
      <p>Share this code with friends and earn <strong>5% reward</strong> on every booking they make!</p>
    </div>
    <p style="text-align:center;"><a href="${dashboardLink}" class="btn">Go to My Dashboard</a></p>
    <div class="divider"></div>
    <p style="font-size:13px;color:#777;">Here's what you can do on your dashboard:</p>
    <ul style="font-size:14px;color:#555;line-height:2;">
      <li>Browse and book health screening packages</li>
      <li>Track your booking status</li>
      <li>View your test results (when available)</li>
      <li>Manage your referrals and rewards</li>
    </ul>
  `;

  try {
    const transporter = createTransporter(cfg);
    await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to,
      subject,
      html: baseHtml(subject, "Your FirmCare account is ready", body),
    });
    await logEmail(to, subject, "welcome", "sent");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEmail(to, subject, "welcome", "failed", msg);
    return { success: false, error: msg };
  }
}

export interface BookingEmailItem {
  title: string;
  amount: number;
}

export async function sendBookingConfirmedEmail(
  to: string,
  name: string | null | undefined,
  bookings: BookingEmailItem[],
  totalPaid: number,
  bookingDate: Date,
  homeCollection: boolean,
  reference: string,
  baseUrl: string
): Promise<SendResult> {
  const cfg = await getSmtpConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    return { success: false, error: "SMTP not configured" };
  }

  const dateStr = bookingDate.toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const rows = bookings
    .map(
      (b) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #f0e8f0;color:#333;font-size:14px;">${b.title}</td>
         <td style="padding:10px 0;border-bottom:1px solid #f0e8f0;text-align:right;color:#333;font-size:14px;">${fmtNgn(b.amount)}</td></tr>`
    )
    .join("");

  const subject = "Booking Confirmed — FirmCare Diagnostics";
  const body = `
    <h2>Your booking is confirmed${name ? `, ${name}` : ""}!</h2>
    <p>Great news! Your payment has been verified and your health screening appointment is confirmed. Here are your booking details:</p>
    <div class="info-box">
      <p class="label">Booking Summary</p>
      <p><strong>Date:</strong> ${dateStr}</p>
      <p><strong>Collection:</strong> ${homeCollection ? "Home Sample Collection" : "Walk-In at Centre"}</p>
      <p><strong>Reference:</strong> ${reference}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px 0;font-size:12px;text-transform:uppercase;color:#A44692;letter-spacing:.5px;">Package</th>
          <th style="text-align:right;padding:8px 0;font-size:12px;text-transform:uppercase;color:#A44692;letter-spacing:.5px;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td style="padding:12px 0;font-weight:700;color:#1a1a2e;font-size:15px;">Total Paid</td>
          <td style="padding:12px 0;font-weight:700;color:#A44692;font-size:15px;text-align:right;">${fmtNgn(totalPaid)}</td>
        </tr>
      </tfoot>
    </table>
    <p style="text-align:center;"><a href="${baseUrl}/dashboard/bookings" class="btn">View My Bookings</a></p>
    <div class="divider"></div>
    <p style="font-size:13px;color:#777;">
      ${homeCollection
        ? "Our phlebotomist will contact you to confirm the home visit schedule. Please be available at your registered address."
        : "Please arrive 10 minutes before your appointment. Bring a valid ID and your booking reference number."}
    </p>
  `;

  try {
    const transporter = createTransporter(cfg);
    await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to,
      subject,
      html: baseHtml(subject, "Your FirmCare booking is confirmed", body),
    });
    await logEmail(to, subject, "booking_confirmed", "sent");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEmail(to, subject, "booking_confirmed", "failed", msg);
    return { success: false, error: msg };
  }
}

export async function sendBookingReminderEmail(
  to: string,
  name: string | null | undefined,
  packageTitle: string,
  bookingDate: Date,
  daysUntil: number,
  homeCollection: boolean,
  baseUrl: string
): Promise<SendResult> {
  const cfg = await getSmtpConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    return { success: false, error: "SMTP not configured" };
  }

  const dateStr = bookingDate.toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const dayLabel = daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`;
  const subject = `Reminder: Your ${packageTitle} appointment is ${dayLabel}`;
  const body = `
    <h2>Don't forget your appointment${name ? `, ${name}` : ""}!</h2>
    <p>This is a friendly reminder that your health screening is coming up <strong>${dayLabel}</strong>.</p>
    <div class="info-box">
      <p class="label">Appointment Details</p>
      <p><strong>Package:</strong> ${packageTitle}</p>
      <p><strong>Date:</strong> ${dateStr}</p>
      <p><strong>Collection:</strong> ${homeCollection ? "Home Sample Collection" : "Walk-In at Centre"}</p>
    </div>
    <p style="text-align:center;"><a href="${baseUrl}/dashboard/bookings" class="btn">View Booking Details</a></p>
    <div class="divider"></div>
    <p style="font-size:13px;color:#777;">
      ${homeCollection
        ? "Please ensure someone is available at your address on the appointment day. Our team will call ahead to confirm timing."
        : "Remember to fast (if required for your tests), bring a valid ID, and arrive 10 minutes early."}
    </p>
    <p style="font-size:13px;color:#999;">Need to reschedule? Contact us at <a href="tel:+2348088743272" style="color:#A44692;">+234-808-874-3272</a> or reply to this email.</p>
  `;

  try {
    const transporter = createTransporter(cfg);
    await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to,
      subject,
      html: baseHtml(subject, `Your appointment is ${dayLabel}`, body),
    });
    await logEmail(to, subject, "booking_reminder", "sent");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEmail(to, subject, "booking_reminder", "failed", msg);
    return { success: false, error: msg };
  }
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SAMPLE_COLLECTED: "Sample Collected",
  IN_PROGRESS: "In Progress",
  RESULTS_READY: "Results Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_MESSAGES: Record<string, string> = {
  SAMPLE_COLLECTED:
    "Great news! We have successfully collected your sample. Our laboratory team will begin processing it shortly.",
  IN_PROGRESS:
    "Your sample is currently being analyzed in our laboratory. We will notify you as soon as your results are ready.",
  RESULTS_READY:
    "Your test results are now available! Log in to your dashboard to view and download your result report.",
  COMPLETED:
    "Your health screening is complete. Thank you for choosing FirmCare Diagnostics for your health needs.",
  CANCELLED:
    "Your booking has been cancelled. If you have any questions or would like to rebook, please contact us.",
};

export async function sendBookingStatusEmail(
  to: string,
  name: string | null | undefined,
  packageTitle: string,
  status: string,
  bookingDate: Date,
  notes: string | null | undefined,
  baseUrl: string
): Promise<SendResult> {
  const cfg = await getSmtpConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    return { success: false, error: "SMTP not configured" };
  }

  const label = STATUS_LABELS[status] ?? status;
  const message =
    STATUS_MESSAGES[status] ??
    `Your booking status has been updated to <strong>${label}</strong>.`;
  const dateStr = bookingDate.toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `Booking Update: ${packageTitle} — ${label}`;
  const body = `
    <h2>Booking Status Update${name ? `, ${name}` : ""}</h2>
    <p>${message}</p>
    <div class="info-box">
      <p class="label">Booking Details</p>
      <p><strong>Package:</strong> ${packageTitle}</p>
      <p><strong>Date:</strong> ${dateStr}</p>
      <p><strong>Status:</strong> <span style="color:#A44692;font-weight:700;">${label}</span></p>
      ${notes ? `<p><strong>Note from our team:</strong> ${notes}</p>` : ""}
    </div>
    <p style="text-align:center;"><a href="${baseUrl}/dashboard/bookings" class="btn">View My Bookings</a></p>
    <div class="divider"></div>
    <p style="font-size:13px;color:#999;">Questions? Contact us at <a href="tel:+2348088743272" style="color:#A44692;">+234-808-874-3272</a> or reply to this email.</p>
  `;

  try {
    const transporter = createTransporter(cfg);
    await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to,
      subject,
      html: baseHtml(subject, `Your booking status: ${label}`, body),
    });
    await logEmail(to, subject, "booking_status_update", "sent");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEmail(to, subject, "booking_status_update", "failed", msg);
    return { success: false, error: msg };
  }
}

export async function sendResultsReadyEmail(
  to: string,
  name: string | null | undefined,
  packageTitle: string,
  bookingDate: Date,
  presignedUrl: string,
  baseUrl: string
): Promise<SendResult> {
  const cfg = await getSmtpConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    return { success: false, error: "SMTP not configured" };
  }

  const dateStr = bookingDate.toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `Your Results Are Ready — ${packageTitle}`;
  const body = `
    <h2>Your results are ready${name ? `, ${name}` : ""}!</h2>
    <p>Your test results for the <strong>${packageTitle}</strong> screening are now available. You can securely view and download your report from your dashboard.</p>
    <div class="info-box">
      <p class="label">Screening Details</p>
      <p><strong>Package:</strong> ${packageTitle}</p>
      <p><strong>Date:</strong> ${dateStr}</p>
    </div>
    <p style="text-align:center;">
      <a href="${baseUrl}/dashboard/bookings" class="btn">View My Results</a>
    </p>
    <p style="text-align:center;font-size:13px;color:#777;">
      Or use this secure link to download your result directly (expires in 15 minutes):<br/>
      <a href="${presignedUrl}" style="color:#A44692;word-break:break-all;">Download Result PDF</a>
    </p>
    <div class="divider"></div>
    <p style="font-size:13px;color:#999;">If you have any questions about your results, please contact your healthcare provider or reach us at <a href="mailto:info@firmcare.com.ng" style="color:#A44692;">info@firmcare.com.ng</a>.</p>
  `;

  try {
    const transporter = createTransporter(cfg);
    await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to,
      subject,
      html: baseHtml(subject, "Your FirmCare test results are ready", body),
    });
    await logEmail(to, subject, "results_ready", "sent");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEmail(to, subject, "results_ready", "failed", msg);
    return { success: false, error: msg };
  }
}

export async function sendGeneralEmail(
  to: string,
  subject: string,
  htmlContent: string,
  unsubscribeUrl?: string | null
): Promise<SendResult> {
  const cfg = await getSmtpConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    return { success: false, error: "SMTP not configured" };
  }

  const body = `<div>${htmlContent}</div>`;

  try {
    const transporter = createTransporter(cfg);
    await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to,
      subject,
      html: baseHtml(subject, subject, body, unsubscribeUrl),
    });
    await logEmail(to, subject, "general", "sent");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEmail(to, subject, "general", "failed", msg);
    return { success: false, error: msg };
  }
}

export async function sendAgentApprovedEmail(
  to: string,
  name: string,
  tempPassword: string,
  referralCode: string,
  baseUrl: string
): Promise<SendResult> {
  const cfg = await getSmtpConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    return { success: false, error: "SMTP not configured" };
  }

  const loginLink = `${baseUrl}/auth/login`;
  const subject = "Congratulations! Your FirmCare Agent Account is Approved";
  const body = `
    <h2>Welcome to the team, ${name}!</h2>
    <p>We're excited to let you know that your application to become a <strong>FirmCare Marketing Agent</strong> has been approved. You can now log in to your agent dashboard and start sharing packages to earn commissions.</p>

    <div class="info-box">
      <p class="label">Your Login Credentials</p>
      <p><strong>Email:</strong> ${to}</p>
      <p><strong>Temporary Password:</strong> <span style="font-family:monospace;font-size:16px;font-weight:700;color:#A44692;letter-spacing:1px;">${tempPassword}</span></p>
      <p style="font-size:13px;color:#e05c00;margin-top:8px;">⚠️ Please change your password immediately after first login.</p>
    </div>

    <div class="info-box" style="background:#f0f9f0;border-left-color:#22c55e;">
      <p class="label" style="color:#16a34a;">Your Referral Code</p>
      <p style="font-size:24px;font-weight:800;color:#16a34a;letter-spacing:3px;">${referralCode}</p>
      <p>Share this code or your personal referral link with potential customers. You earn a commission on every booking made through your link.</p>
    </div>

    <p style="text-align:center;"><a href="${loginLink}" class="btn">Log In to My Dashboard</a></p>
    <div class="divider"></div>
    <p style="font-size:13px;color:#777;">From your agent dashboard you can:</p>
    <ul style="font-size:14px;color:#555;line-height:2;">
      <li>View your referral statistics and earnings</li>
      <li>Share personalized links for all available packages</li>
      <li>Request withdrawals once your earnings are confirmed</li>
      <li>Manage your bank account details for payouts</li>
    </ul>
    <p style="font-size:13px;color:#999;">Have questions? Reply to this email or contact us at <a href="mailto:info@firmcare.com.ng" style="color:#A44692;">info@firmcare.com.ng</a>.</p>
  `;

  try {
    const transporter = createTransporter(cfg);
    await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to,
      subject,
      html: baseHtml(subject, "Your agent account is now active!", body),
    });
    await logEmail(to, subject, "agent_approved", "sent");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEmail(to, subject, "agent_approved", "failed", msg);
    return { success: false, error: msg };
  }
}

export async function sendAgentRejectedEmail(
  to: string,
  name: string,
  reason?: string
): Promise<SendResult> {
  const cfg = await getSmtpConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    return { success: false, error: "SMTP not configured" };
  }

  const subject = "Update on Your FirmCare Agent Application";
  const body = `
    <h2>Application Update, ${name}</h2>
    <p>Thank you for your interest in becoming a FirmCare Marketing Agent. After reviewing your application, we are unable to approve it at this time.</p>
    ${reason ? `<div class="info-box"><p class="label">Feedback</p><p>${reason}</p></div>` : ""}
    <p>You are welcome to re-apply in the future. If you have any questions or would like further clarification, please don't hesitate to reach out.</p>
    <div class="divider"></div>
    <p style="font-size:13px;color:#999;">Contact us at <a href="mailto:info@firmcare.com.ng" style="color:#A44692;">info@firmcare.com.ng</a> — we're happy to help.</p>
  `;

  try {
    const transporter = createTransporter(cfg);
    await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to,
      subject,
      html: baseHtml(subject, "Update on your agent application", body),
    });
    await logEmail(to, subject, "agent_rejected", "sent");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEmail(to, subject, "agent_rejected", "failed", msg);
    return { success: false, error: msg };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  name: string | null | undefined,
  token: string,
  baseUrl: string
): Promise<SendResult> {
  const cfg = await getSmtpConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    return { success: false, error: "SMTP not configured" };
  }

  const link = `${baseUrl}/auth/reset-password?token=${token}`;
  const subject = "Reset your FirmCare password";
  const body = `
    <h2>Password reset request${name ? `, ${name}` : ""}</h2>
    <p>We received a request to reset the password for your FirmCare account. Click the button below to choose a new password.</p>
    <p style="text-align:center;"><a href="${link}" class="btn">Reset My Password</a></p>
    <p style="font-size:13px;color:#888;">Or copy and paste this link into your browser:<br/>
    <a href="${link}" style="color:#A44692;word-break:break-all;">${link}</a></p>
    <div class="divider"></div>
    <p style="font-size:13px;color:#999;">This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will not change.</p>
  `;

  try {
    const transporter = createTransporter(cfg);
    await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to,
      subject,
      html: baseHtml(subject, "Reset your FirmCare password", body),
    });
    await logEmail(to, subject, "password_reset", "sent");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEmail(to, subject, "password_reset", "failed", msg);
    return { success: false, error: msg };
  }
}
