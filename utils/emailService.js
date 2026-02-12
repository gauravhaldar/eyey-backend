import nodemailer from "nodemailer";

// Create reusable transporter using Gmail SMTP
const createTransporter = () => {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
};

/**
 * Send vendor approval email with login credentials
 */
export const sendVendorApprovalEmail = async (vendor, plainPassword) => {
    const transporter = createTransporter();

    const loginUrl = "http://localhost:3000/vendor/login";

    const mailOptions = {
        from: `"EYEY Marketplace" <${process.env.EMAIL_ADDRESS}>`,
        to: vendor.email,
        subject: "🎉 Your EYEY Vendor Account Has Been Approved!",
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:40px 32px;text-align:center;">
            <h1 style="color:#ffffff;font-size:28px;margin:0 0 8px;font-weight:800;letter-spacing:-0.5px;">
              Welcome to <span style="color:#2563eb;">EYEY</span>
            </h1>
            <p style="color:#94a3b8;font-size:14px;margin:0;">Your vendor account has been approved</p>
          </div>

          <!-- Body -->
          <div style="padding:32px;">
            <p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px;">
              Hi <strong>${vendor.ownerName}</strong>,
            </p>
            <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Great news! Your vendor application for <strong>${vendor.businessName}</strong> has been reviewed and <span style="color:#22c55e;font-weight:700;">approved</span>. You can now log in to your vendor dashboard and start listing your products.
            </p>

            <!-- Credentials Card -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin:0 0 24px;">
              <h3 style="color:#0f172a;font-size:14px;margin:0 0 16px;text-transform:uppercase;letter-spacing:1px;">Your Login Credentials</h3>
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;">Email:</td>
                  <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;">${vendor.email}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#64748b;font-size:14px;">Password:</td>
                  <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;font-family:monospace;letter-spacing:1px;">${plainPassword}</td>
                </tr>
              </table>
            </div>

            <!-- CTA Button -->
            <div style="text-align:center;margin:32px 0;">
              <a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:0.5px;">
                Login to Vendor Dashboard →
              </a>
            </div>

            <!-- Security Note -->
            <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:0 0 24px;">
              <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5;">
                ⚠️ <strong>Security Note:</strong> Please change your password after your first login. Do not share your credentials with anyone.
              </p>
            </div>

            <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
              If you have any questions, reply to this email or contact us at <a href="mailto:partners@eyey.com" style="color:#2563eb;">partners@eyey.com</a>.
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:11px;margin:0;">
              © 2026 EYEY Marketplace. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Vendor approval email sent:", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("❌ Error sending vendor approval email:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Send vendor rejection email
 */
export const sendVendorRejectionEmail = async (vendor, reason) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `"EYEY Marketplace" <${process.env.EMAIL_ADDRESS}>`,
        to: vendor.email,
        subject: "Update on Your EYEY Vendor Application",
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:40px 32px;text-align:center;">
            <h1 style="color:#ffffff;font-size:28px;margin:0 0 8px;font-weight:800;">
              <span style="color:#2563eb;">EYEY</span> Marketplace
            </h1>
            <p style="color:#94a3b8;font-size:14px;margin:0;">Application Status Update</p>
          </div>
          <div style="padding:32px;">
            <p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px;">
              Hi <strong>${vendor.ownerName}</strong>,
            </p>
            <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 24px;">
              We've reviewed your vendor application for <strong>${vendor.businessName}</strong>. Unfortunately, we're unable to approve your application at this time.
            </p>
            ${reason ? `
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:0 0 24px;">
              <p style="color:#991b1b;font-size:14px;margin:0;"><strong>Reason:</strong> ${reason}</p>
            </div>
            ` : ""}
            <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0;">
              You may reapply after addressing the above concerns. For questions, contact <a href="mailto:partners@eyey.com" style="color:#2563eb;">partners@eyey.com</a>.
            </p>
          </div>
          <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:11px;margin:0;">© 2026 EYEY Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Vendor rejection email sent:", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("❌ Error sending vendor rejection email:", error);
        return { success: false, error: error.message };
    }
};
