"""Create an admin account. Admin registration is not allowed through the public API.

Windows PowerShell:

  cd backend
  .\\.venv\\Scripts\\Activate.ps1
  python create_admin.py

Credentials come from environment variables, or you will be prompted:

  ADMIN_NAME
  ADMIN_EMAIL
  ADMIN_PASSWORD
"""

from getpass import getpass
import os
import sys

from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError

from dotenv import load_dotenv

from app.core.config import get_settings
from app.core.security import hash_password
from app.utils.datetime import utc_now


def main() -> int:
    load_dotenv()
    settings = get_settings()
    name = os.getenv("ADMIN_NAME") or input("Admin name: ").strip()
    email = (os.getenv("ADMIN_EMAIL") or input("Admin email: ").strip()).lower()
    password = os.getenv("ADMIN_PASSWORD") or getpass("Admin password: ")

    if not name or not email or not password:
        print("Name, email, and password are required.")
        return 1
    if len(password) < 8:
        print("Password must be at least 8 characters.")
        return 1

    client = MongoClient(settings.mongodb_uri)
    db = client[settings.mongodb_database]
    db.users.create_index("email", unique=True)

    if db.users.find_one({"email": email}):
        print(f"An account with email {email} already exists.")
        client.close()
        return 1

    now = utc_now()
    try:
        db.users.insert_one(
            {
                "name": name,
                "email": email,
                "password_hash": hash_password(password),
                "role": "admin",
                "is_verified": True,
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
        )
    except DuplicateKeyError:
        print(f"An account with email {email} already exists.")
        client.close()
        return 1

    client.close()
    print(f"Admin account created for {email}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
