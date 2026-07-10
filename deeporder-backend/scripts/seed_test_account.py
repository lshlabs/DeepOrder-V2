"""Seed (or reset) a ready-to-use test owner account for local development.

Creates an APPROVED store owner account so you can log into the KDS immediately:

    login id : admin123
    password : admin123!

The script is idempotent: running it again re-approves the account and resets
the password, so it is safe to re-run at any time.

Usage:
    cd deeporder-backend
    python -m scripts.seed_test_account
    # or override the defaults:
    python -m scripts.seed_test_account --login-id owner01 --password "secret123" \
        --store-name "테스트 매장"
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Allow running via `python scripts/seed_test_account.py` as well as `-m`.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import func, select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.auth import hash_password  # noqa: E402
from app.database import SessionLocal, create_db_and_tables  # noqa: E402
from app.models import (  # noqa: E402
    AccountType,
    ApprovalStatus,
    Store,
    User,
    UserRole,
)

DEFAULT_LOGIN_ID = "admin123"
DEFAULT_PASSWORD = "admin123!"
DEFAULT_NAME = "테스트 관리자"
DEFAULT_STORE_ID = "STORE_TEST"
DEFAULT_STORE_NAME = "테스트 매장"


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed a test store-owner account.")
    parser.add_argument("--login-id", default=DEFAULT_LOGIN_ID)
    parser.add_argument("--password", default=DEFAULT_PASSWORD)
    parser.add_argument("--name", default=DEFAULT_NAME)
    parser.add_argument("--store-id", default=DEFAULT_STORE_ID)
    parser.add_argument("--store-name", default=DEFAULT_STORE_NAME)
    return parser.parse_args()


def _upsert_store(db: Session, store_id: str, store_name: str) -> Store:
    store = db.scalar(select(Store).where(Store.store_id == store_id))
    if store is None:
        store = Store(store_id=store_id, store_name=store_name)
        db.add(store)
    store.store_name = store_name
    store.approval_status = ApprovalStatus.APPROVED
    db.flush()
    return store


def _upsert_owner(
    db: Session,
    *,
    login_id: str,
    password: str,
    name: str,
    store_id: str,
) -> tuple[User, bool]:
    normalized = login_id.strip().lower()
    user = db.scalar(select(User).where(func.lower(User.login_id) == normalized))
    created = user is None
    if user is None:
        user = User(login_id=normalized, store_id=store_id, name=name)
        db.add(user)

    user.name = name
    user.store_id = store_id
    user.password_hash = hash_password(password)
    user.pin_hash = None
    user.role = UserRole.STORE_OWNER
    user.account_type = AccountType.OWNER
    user.approval_status = ApprovalStatus.APPROVED
    user.active = True
    user.deleted_at = None
    db.flush()
    return user, created


def main() -> None:
    args = _parse_args()

    create_db_and_tables()

    with SessionLocal() as db:
        store = _upsert_store(db, args.store_id, args.store_name)
        _, created = _upsert_owner(
            db,
            login_id=args.login_id,
            password=args.password,
            name=args.name,
            store_id=store.store_id,
        )
        # Capture values before commit expires the ORM instances.
        store_name = store.store_name
        store_id = store.store_id
        db.commit()

    action = "생성" if created else "갱신"
    print(f"[seed] 테스트 계정 {action} 완료")
    print(f"       login id : {args.login_id}")
    print(f"       password : {args.password}")
    print(f"       store    : {store_name} ({store_id})")
    print(f"       status   : APPROVED / OWNER")


if __name__ == "__main__":
    main()
