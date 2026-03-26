"""
Two-Factor Authentication (2FA) utilities
"""
import pyotp
import qrcode
from io import BytesIO
import base64
import secrets


def generate_2fa_secret():
    """Generate a random secret for TOTP"""
    return pyotp.random_base32()


def generate_qr_code(email: str, secret: str, issuer: str = "AI Beauty Consultant"):
    """
    Generate QR code for authenticator apps
    
    Args:
        email: User's email address
        secret: TOTP secret
        issuer: App name
    
    Returns:
        Base64 encoded QR code image
    """
    # Create TOTP URI
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=email, issuer_name=issuer)
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"


def verify_totp_code(secret: str, code: str, window: int = 1):
    """
    Verify TOTP code
    
    Args:
        secret: User's TOTP secret
        code: 6-digit code from authenticator app
        window: Number of time windows to check (default 1 = 30 seconds before/after)
    
    Returns:
        bool: True if code is valid
    """
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=window)


def generate_backup_codes(count: int = 10):
    """
    Generate backup codes for emergency access
    
    Args:
        count: Number of backup codes to generate
    
    Returns:
        List of backup codes
    """
    codes = []
    for _ in range(count):
        # Generate 8-character alphanumeric code
        code = secrets.token_hex(4).upper()
        # Format as XXXX-XXXX
        formatted_code = f"{code[:4]}-{code[4:]}"
        codes.append(formatted_code)
    return codes


def hash_backup_code(code: str):
    """Hash backup code for storage"""
    from app.auth.security import hash_password
    return hash_password(code)


def verify_backup_code(code: str, hashed_code: str):
    """Verify backup code"""
    from app.auth.security import verify_password
    return verify_password(code, hashed_code)
