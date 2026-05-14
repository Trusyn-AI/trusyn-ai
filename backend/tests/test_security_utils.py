from __future__ import annotations

from app.core.security import hash_password, verify_password


def test_password_hash_and_verify():
    password = "TrusynSecure!123"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong-password", hashed) is False

