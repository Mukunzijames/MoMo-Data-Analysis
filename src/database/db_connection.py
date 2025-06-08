import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db_connection():
    """
    Create and return a connection to the Neon PostgreSQL database
    using the DATABASE_URL environment variable
    """
    try:
        # Use the DATABASE_URL from the .env file
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("DATABASE_URL environment variable not found")
            return None
            
        connection = psycopg2.connect(database_url)
        return connection
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def test_connection():
    """
    Test the database connection
    """
    conn = get_db_connection()
    if conn:
        print("Successfully connected to the database")
        conn.close()
        return True
    else:
        print("Failed to connect to the database")
        return False 