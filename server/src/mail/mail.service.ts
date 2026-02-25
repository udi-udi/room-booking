import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'

interface SendLoginLinkParams {
  to: string
  firstName: string
  companyName: string
  companyColor: string
  email: string
  temporaryPassword: string
  loginUrl: string
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

// Returns '#ffffff' or '#000000' for readable contrast on the given background
function contrastColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  // Perceived luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '#000000' : '#ffffff'
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private transporter: nodemailer.Transporter

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('MAIL_HOST', 'smtp.gmail.com'),
      port: config.get<number>('MAIL_PORT', 587),
      secure: false,
      auth: {
        user: config.get('MAIL_USER'),
        pass: config.get('MAIL_PASS'),
      },
    })
  }

  async sendLoginLink(params: SendLoginLinkParams): Promise<void> {
    const { to, firstName, companyName, companyColor, email, temporaryPassword, loginUrl } = params
    const textColor = contrastColor(companyColor)

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${companyColor};padding:32px 40px;">
              <h1 style="margin:0;color:${textColor};font-size:22px;font-weight:600;">Room Booking System</h1>
            </td>
          </tr>

          <!-- English body -->
          <tr>
            <td style="padding:40px 40px 20px;">
              <p style="margin:0 0 16px;font-size:16px;color:#333;">Hi <strong>${firstName}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                You've been invited to the <strong>${companyName}</strong> room booking system.
                Click the button below to log in and set your password.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:${companyColor};border-radius:6px;">
                    <a href="${loginUrl}" style="display:inline-block;padding:14px 32px;color:${textColor};font-size:15px;font-weight:600;text-decoration:none;">
                      Log In &amp; Set Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;font-size:14px;color:#555;">Or use these credentials to log in manually:</p>
              <table cellpadding="0" cellspacing="0" style="background:#f9f9f9;border:1px solid #e0e0e0;border-radius:6px;padding:16px;width:100%;">
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#555;width:160px;">Email:</td>
                  <td style="padding:4px 0;font-size:14px;color:#333;font-weight:600;">${email}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#555;">Temporary Password:</td>
                  <td style="padding:4px 0;font-size:14px;color:#333;font-weight:600;font-family:monospace;">${temporaryPassword}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#555;">Login URL:</td>
                  <td style="padding:4px 0;font-size:14px;"><a href="${loginUrl.split('?')[0]}" style="word-break:break-all;">${loginUrl.split('?')[0]}</a></td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:13px;color:#888;font-style:italic;">
                You will be asked to set a new password on first login.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;">
            </td>
          </tr>

          <!-- Hebrew body (RTL) -->
          <tr>
            <td style="padding:20px 40px 40px;" dir="rtl">
              <p style="margin:0 0 16px;font-size:16px;color:#333;">שלום <strong>${firstName}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                נוספת למערכת הזמנת החדרים של <strong>${companyName}</strong>.
                לחץ על הכפתור להתחברות ולהגדרת סיסמה.
              </p>

              <!-- CTA button (Hebrew) -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:${companyColor};border-radius:6px;">
                    <a href="${loginUrl}" style="display:inline-block;padding:14px 32px;color:${textColor};font-size:15px;font-weight:600;text-decoration:none;">
                      כניסה והגדרת סיסמה
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;font-size:14px;color:#555;">או השתמש בפרטים הבאים להתחברות ידנית:</p>
              <table cellpadding="0" cellspacing="0" style="background:#f9f9f9;border:1px solid #e0e0e0;border-radius:6px;padding:16px;width:100%;">
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#555;width:160px;">דוא״ל:</td>
                  <td style="padding:4px 0;font-size:14px;color:#333;font-weight:600;">${email}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#555;">סיסמה זמנית:</td>
                  <td style="padding:4px 0;font-size:14px;color:#333;font-weight:600;font-family:monospace;">${temporaryPassword}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#555;">קישור כניסה:</td>
                  <td style="padding:4px 0;font-size:14px;"><a href="${loginUrl.split('?')[0]}" style="word-break:break-all;">${loginUrl.split('?')[0]}</a></td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:13px;color:#888;font-style:italic;">
                בהתחברות הראשונה תתבקש להגדיר סיסמה חדשה.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f5f5;padding:16px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaa;">This is an automated message — please do not reply.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()

    try {
      await this.transporter.sendMail({
        from: `"Room Booking" <${this.config.get('MAIL_USER')}>`,
        to,
        subject: `You've been added to ${companyName} Room Booking System`,
        html,
      })
      this.logger.log(`Login link email sent to ${to}`)
    } catch (err) {
      this.logger.error(`Failed to send login link email to ${to}`, err)
      // Do not throw — email failure should not break the invite flow
    }
  }
}
