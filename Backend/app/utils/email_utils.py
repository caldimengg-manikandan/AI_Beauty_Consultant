import os
import smtplib
import sys
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Load SMTP Settings from environment variables
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

_log = logging.getLogger("beauty_api.email")

# OTP codes must never reach logs/stdout/stderr in production — that's the
# verification credential itself. The dev-mode console fallback below is
# only safe on a local/dev machine where the "log" is just your own terminal.
_ENVIRONMENT = (os.getenv("ENVIRONMENT") or os.getenv("APP_ENV") or "development").strip().lower()
_IS_PRODUCTION = _ENVIRONMENT in ("production", "prod")


def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Sends a 6-digit verification OTP email to the user.
    In non-production environments, if SMTP credentials are not supplied,
    falls back to printing the OTP to the local terminal (for development
    convenience only). In production, this fallback is disabled — if email
    can't be sent, the OTP is never written anywhere and this returns False
    so the caller can surface a "verification email failed to send" error
    instead of silently leaking/dropping the code.
    """
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        if _IS_PRODUCTION:
            _log.error(
                "OTP email for %s could not be sent: SMTP_EMAIL/SMTP_PASSWORD not configured in production.",
                to_email,
            )
            return False
        # Fallback for development/testing only — never in production.
        print("\n" + "="*80, file=sys.stderr)
        print(f"📧 [DEVELOPMENT MODE] Email OTP for {to_email} is: {otp}", file=sys.stderr)
        print("="*80 + "\n", file=sys.stderr)
        return True

    try:
        # Setup the MIME message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"GlowAI — Verify Your Email ({otp})"
        msg["From"] = f"GlowAI Support <{SMTP_EMAIL}>"
        msg["To"] = to_email

        # HTML body
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
            }}
            .container {{
              max-width: 500px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 24px;
              padding: 40px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.03);
              border: 1px solid #e2e8f0;
            }}
            .logo-container {{
              text-align: center;
              margin-bottom: 24px;
            }}
            .logo {{
              background: linear-gradient(135deg, #7c3aed 0%, #14b8a6 100%);
              width: 50px;
              height: 50px;
              border-radius: 16px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 800;
              font-size: 20px;
              line-height: 50px;
              text-align: center;
              box-shadow: 0 8px 16px rgba(124, 58, 237, 0.2);
            }}
            .title {{
              font-size: 22px;
              font-weight: 800;
              text-align: center;
              color: #0f172a;
              margin: 0 0 10px 0;
            }}
            .subtitle {{
              font-size: 14px;
              text-align: center;
              color: #64748b;
              margin: 0 0 28px 0;
              line-height: 1.5;
            }}
            .otp-container {{
              text-align: center;
              margin: 28px 0;
              padding: 24px;
              background: #f8fafc;
              border-radius: 20px;
              border: 1px dashed #cbd5e1;
            }}
            .otp-code {{
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              font-size: 38px;
              font-weight: 800;
              letter-spacing: 8px;
              color: #7c3aed;
              margin: 0;
              padding-left: 8px; /* offsets letter-spacing visual shift */
            }}
            .info-text {{
              font-size: 13px;
              color: #64748b;
              text-align: center;
              margin: 28px 0 0 0;
              line-height: 1.6;
            }}
            .footer {{
              font-size: 11px;
              text-align: center;
              color: #94a3b8;
              margin-top: 36px;
              border-top: 1px solid #f1f5f9;
              padding-top: 20px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo-container">
              <div class="logo">AI</div>
            </div>
            <h1 class="title">Verify Your Email</h1>
            <p class="subtitle">Thank you for joining GlowAI. Use the 6-digit OTP below to verify your account and complete your signup.</p>
            <div class="otp-container">
              <h2 class="otp-code">{otp}</h2>
            </div>
            <p class="info-text">This code is valid for 15 minutes.<br>If you did not request this verification, you can safely ignore this email.</p>
            <div class="footer">
              © 2026 GlowAI · AI Beauty Consultant Platform
            </div>
          </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html_content, "html"))

        # Connect and send
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=10) as server:
                server.login(SMTP_EMAIL, SMTP_PASSWORD)
                server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        else:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10) as server:
                server.starttls()
                server.login(SMTP_EMAIL, SMTP_PASSWORD)
                server.sendmail(SMTP_EMAIL, to_email, msg.as_string())

        return True
    except Exception as e:
        if _IS_PRODUCTION:
            # Never print the OTP itself in production — just the failure.
            _log.error("SMTP send failed for %s: %s", to_email, e)
            return False
        # Non-production: log the exception and fall back to console output
        # so local development isn't blocked by a misconfigured SMTP setup.
        print(f"❌ SMTP Send Failed: {str(e)}", file=sys.stderr)
        print("\n" + "="*80, file=sys.stderr)
        print(f"📧 [FALLBACK DEV MODE] Email OTP for {to_email} is: {otp}", file=sys.stderr)
        print("="*80 + "\n", file=sys.stderr)
        return True
