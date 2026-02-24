"""
One-time migration: add is_approved column to users table.
Run this if you're upgrading from an earlier schema that didn't have it.
"""

import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'contract_analyzer.db')

if not os.path.exists(DB_PATH):
    print(f"DB not found at {DB_PATH}. Run the app first to create it.")
else:
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    # Check if column already exists
    cols = [row[1] for row in cur.execute("PRAGMA table_info(users)").fetchall()]
    if 'is_approved' not in cols:
        cur.execute("ALTER TABLE users ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT 0")
        # Auto-approve existing clients and admins
        cur.execute("UPDATE users SET is_approved = 1 WHERE role IN ('client', 'admin')")
        con.commit()
        print("✅  Added is_approved column and approved all existing clients/admins.")
    else:
        print("✅  is_approved column already exists — nothing to do.")
    con.close()
