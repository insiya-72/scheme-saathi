import sqlite3
from pathlib import Path
from contextlib import contextmanager

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = BASE_DIR / "scheme_saathi.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DATABASE_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                identifier TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_users_identifier ON users(identifier);
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                age TEXT,
                gender TEXT,
                category TEXT,
                state TEXT,
                district TEXT,
                annual_income REAL,
                purpose TEXT,
                business_type TEXT,
                project_stage TEXT,
                project_cost REAL,
                required_loan REAL,
                course TEXT,
                institution TEXT,
                course_fee REAL,
                education_level TEXT,
                own_contribution REAL,
                existing_loan TEXT,
                outstanding_amount REAL,
                overdue TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                application_number TEXT UNIQUE NOT NULL,
                user_id INTEGER,
                scheme_id TEXT NOT NULL,
                scheme_name TEXT NOT NULL,
                applicant_name TEXT NOT NULL,
                applicant_phone TEXT NOT NULL,
                category TEXT,
                state TEXT,
                district TEXT,
                loan_amount REAL NOT NULL,
                purpose TEXT,
                channel_partner_name TEXT,
                status TEXT DEFAULT 'submitted',
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_applications_number ON applications(application_number);
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_applications_phone ON applications(applicant_phone);
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS application_timeline (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                application_id INTEGER NOT NULL,
                stage TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
            );
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_application_timeline_app ON application_timeline(application_id);
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                application_id INTEGER,
                document_type TEXT NOT NULL,
                document_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER,
                file_type TEXT,
                verification_status TEXT DEFAULT 'pending',
                verified_at TIMESTAMP,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL
            );
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);
            """
        )

