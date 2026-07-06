import os
from pathlib import Path

os.environ.setdefault("DEEPORDER_DATABASE_URL", "sqlite:///./test_deeporder.db")

test_db_path = Path("test_deeporder.db")
if test_db_path.exists():
    test_db_path.unlink()
