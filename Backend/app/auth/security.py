# from passlib.context import CryptContext

# pwd_context = CryptContext(
#     schemes=["argon2"],
#     deprecated="auto"
# )

# def hash_password(password: str) -> str:
#     return pwd_context.hash(password)

# def verify_password(password: str, hashed: str) -> bool:
#     return pwd_context.verify(password, hashed)


from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto"
)

def hash_password(password: str) -> str:
    if not isinstance(password, str):
        raise ValueError("Password must be a string")

    password = password.strip()

    if not password:
        raise ValueError("Password cannot be empty")

    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
