import os
import json
import time
import hmac
import base64
import secrets
import hashlib
import binascii
from typing import Optional, Dict, Any

from fastapi import Depends, HTTPException, Header, status
from database.database import get_db

TOKEN_EXPIRY_SECONDS = 86400 * 30  # 30 days


def _get_jwt_secret() -> str:
    secret = os.environ.get("JWT_SECRET_KEY")
    if not secret or not secret.strip():
        from pathlib import Path
        from dotenv import load_dotenv
        here = Path(__file__).resolve()
        possible_envs = [
            here.parent.parent / ".env",          # backend/.env
            here.parent.parent.parent / ".env",   # root .env
            Path.cwd() / ".env",
        ]
        for env_path in possible_envs:
            if env_path.exists():
                load_dotenv(env_path, override=True)
                secret = os.environ.get("JWT_SECRET_KEY")
                if secret and secret.strip():
                    break
    if not secret or not secret.strip():
        raise RuntimeError(
            "JWT_SECRET_KEY environment variable is required and must not be empty. "
            "Please configure JWT_SECRET_KEY in your environment or .env file."
        )
    return secret.strip()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations=100_000,
    )
    return f"pbkdf2:sha256:100000${salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        parts = hashed_password.split("$")
        if len(parts) != 3:
            return False
        algorithm_header, salt, stored_hash = parts
        _, _, iterations_str = algorithm_header.split(":")
        iterations = int(iterations_str)
        key = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations=iterations,
        )
        return hmac.compare_digest(key.hex(), stored_hash)
    except (ValueError, TypeError, AttributeError):
        return False


def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data)


def create_access_token(user_id: int, identifier: str, expires_in: int = TOKEN_EXPIRY_SECONDS) -> str:
    secret_key = _get_jwt_secret()
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    exp = now + expires_in
    payload = {
        "sub": str(user_id),
        "identifier": identifier,
        "exp": exp,
        "iat": now,
        "jti": secrets.token_hex(16),
    }
    header_b64 = _b64_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    message = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(secret_key.encode("utf-8"), message, hashlib.sha256).digest()
    sig_b64 = _b64_encode(signature)
    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    if not token or not isinstance(token, str):
        return None
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        message = f"{header_b64}.{payload_b64}".encode("utf-8")
        secret_key = _get_jwt_secret()
        expected_sig = hmac.new(secret_key.encode("utf-8"), message, hashlib.sha256).digest()
        actual_sig = _b64_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        payload_bytes = _b64_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
        if not isinstance(payload, dict):
            return None
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except (ValueError, TypeError, AttributeError, binascii.Error, json.JSONDecodeError, UnicodeDecodeError):
        return None


def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not authorization:
        raise credentials_exception

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise credentials_exception

    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise credentials_exception

    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise credentials_exception

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, identifier, created_at FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            raise credentials_exception
        return {
            "id": row["id"],
            "name": row["name"],
            "identifier": row["identifier"],
            "created_at": str(row["created_at"]),
        }

