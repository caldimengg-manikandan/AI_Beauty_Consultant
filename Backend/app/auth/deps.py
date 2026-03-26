# from fastapi import Depends, HTTPException
# from fastapi.security import OAuth2PasswordBearer
# from jose import jwt, JWTError

# from app.auth.jwt_handler import SECRET_KEY, ALGORITHM

# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# def get_current_user(token: str = Depends(oauth2_scheme)):
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         return {
#             "email": payload.get("sub"),
#             "role": payload.get("role")
#         }
#     except JWTError:
#         raise HTTPException(status_code=401, detail="Invalid or expired token")


# def require_admin(user=Depends(get_current_user)):
#     if user["role"] != "admin":
#         raise HTTPException(status_code=403, detail="Admin access required")
#     return user





from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import os

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_key")
ALGORITHM = "HS256"

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")

        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        return {"email": email, "role": role}

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

def require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
