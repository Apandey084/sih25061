// lib/mailTemplates.js

export function resetPasswordEmailTemplate(name, resetURL) {
  return `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f9fafb; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
      <h2 style="color: #166534; text-align: center;">🔑 Password Reset Request</h2>
      <p style="font-size: 16px;">Hi ${name || "there"},</p>
      <p style="font-size: 15px; color: #374151;">
        We received a request to reset your password for your Monastery Portal account.
      </p>
      <p style="font-size: 15px; color: #374151;">
        Click the button below to choose a new password. This link will expire in <b>1 hour</b>.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetURL}"
           style="background-color: #16a34a; color: white; padding: 12px 20px; border-radius: 8px;
                  text-decoration: none; font-weight: 600;">
          Reset Password
        </a>
      </div>

      <p style="font-size: 14px; color: #6b7280;">
        If you didn’t request a password reset, you can safely ignore this email.
      </p>
      <hr style="margin: 25px 0; border: none; border-top: 1px solid #e5e7eb;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        © ${new Date().getFullYear()} Monastery Portal — Secure Login System
      </p>
    </div>
  </div>
  `;
}

export function passwordResetSuccessTemplate(name) {
  return `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f9fafb; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
      <h2 style="color: #166534; text-align: center;">✅ Password Changed Successfully</h2>
      <p style="font-size: 16px;">Hi ${name || "there"},</p>
      <p style="font-size: 15px; color: #374151;">
        Your password was changed successfully. If this was you, no action is required.
      </p>
      <p style="font-size: 15px; color: #374151;">
        If you didn’t initiate this change, please contact our support team immediately.
      </p>
      <hr style="margin: 25px 0; border: none; border-top: 1px solid #e5e7eb;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        © ${new Date().getFullYear()} Monastery Portal — Security Notification
      </p>
    </div>
  </div>
  `;
}
