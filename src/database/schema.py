import sys
import os

# Add the parent directory to the path so we can import the db_connection module
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from database.db_connection import get_db_connection

def create_tables():
    """
    Create the necessary tables for the MoMo data application
    """
    connection = get_db_connection()
    if not connection:
        return False
    
    cursor = connection.cursor()
    
    # Create users table for authentication
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create SMS messages table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sms_messages (
        id SERIAL PRIMARY KEY,
        message_type VARCHAR(50),
        sender VARCHAR(50),
        timestamp TIMESTAMP,
        raw_content TEXT,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create transactions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        sms_id INTEGER REFERENCES sms_messages(id),
        transaction_type VARCHAR(50),
        amount NUMERIC(10, 2),
        sender_receiver VARCHAR(100),
        reference_number VARCHAR(50),
        timestamp TIMESTAMP,
        status VARCHAR(20),
        fee NUMERIC(10, 2),
        balance NUMERIC(10, 2)
    )
    ''')
    
    connection.commit()
    cursor.close()
    connection.close()
    
    print("Database tables created successfully")
    return True

if __name__ == "__main__":
    create_tables() 