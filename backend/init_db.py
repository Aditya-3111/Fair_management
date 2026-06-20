import pymysql
import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', 3306))
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'fair_management')

MASTER_NAME = os.getenv('MASTER_NAME', 'Master Admin')
MASTER_EMAIL = os.getenv('MASTER_EMAIL', 'master@venus.com')
MASTER_PHONE = os.getenv('MASTER_PHONE', '9999999999')
MASTER_PASSWORD = os.getenv('MASTER_PASSWORD', 'master@123')


def run():
    # Step 1: connect WITHOUT selecting a database, create DB if missing
    conn = pymysql.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASSWORD)
    with conn.cursor() as cur:
        cur.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
    conn.commit()
    conn.close()

    # Step 2: connect to the actual database, create tables if missing
    conn = pymysql.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASSWORD, database=DB_NAME)
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20),
                password VARCHAR(255) NOT NULL,
                role ENUM('master', 'admin', 'employee') NOT NULL DEFAULT 'employee',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS field_works (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id INT NOT NULL,
                admin_id INT NOT NULL,
                title VARCHAR(200) NOT NULL,
                location VARCHAR(200),
                description TEXT,
                status ENUM('active', 'completed') DEFAULT 'active',
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                total_expense DECIMAL(10,2) DEFAULT 0.00,
                report_sent BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES users(id),
                FOREIGN KEY (admin_id) REFERENCES users(id)
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                field_work_id INT NOT NULL,
                employee_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                remark TEXT NOT NULL,
                payment_screenshot_url VARCHAR(500) NULL,
                payment_screenshot_public_id VARCHAR(200) NULL,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (field_work_id) REFERENCES field_works(id),
                FOREIGN KEY (employee_id) REFERENCES users(id)
            )
        """)
    conn.commit()

    # Step 3: create master account if it doesn't exist
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE role = 'master' LIMIT 1")
        existing_master = cur.fetchone()

    if not existing_master:
        hashed = bcrypt.hashpw(MASTER_PASSWORD.encode(), bcrypt.gensalt()).decode()
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO users (name, email, phone, password, role) VALUES (%s, %s, %s, %s, 'master')",
                (MASTER_NAME, MASTER_EMAIL, MASTER_PHONE, hashed)
            )
        conn.commit()
        print(f"✅ Master account created -> Email: {MASTER_EMAIL} | Password: {MASTER_PASSWORD}")
        print("   ⚠️  Please log in and change this password, or set MASTER_PASSWORD in .env before first run.")
    else:
        print("ℹ️  Master account already exists, skipping creation.")

    conn.close()
    print("✅ Database and tables ready.")


if __name__ == '__main__':
    run()