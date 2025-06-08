import sys
import os

# Add the parent directory to the path so we can import the db_connection module
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from database.db_connection import get_db_connection

def create_user(username, password, email=None):
    """
    Create a new user in the database
    
    Args:
        username (str): Username for the new user
        password (str): Password for the new user
        email (str, optional): Email for the new user
        
    Returns:
        int: The ID of the newly created user, or None if failed
    """
    connection = get_db_connection()
    if not connection:
        return None
    
    try:
        cursor = connection.cursor()
        
        # In a real application, the password should be hashed
        cursor.execute(
            "INSERT INTO users (username, password, email) VALUES (%s, %s, %s) RETURNING id",
            (username, password, email)
        )
        
        user_id = cursor.fetchone()[0]
        connection.commit()
        
        return user_id
    except Exception as e:
        connection.rollback()
        print(f"Error creating user: {e}")
        return None
    finally:
        connection.close()

def get_user_by_id(user_id):
    """
    Get a user by their ID
    
    Args:
        user_id (int): The ID of the user to retrieve
        
    Returns:
        dict: User data if found, None otherwise
    """
    connection = get_db_connection()
    if not connection:
        return None
    
    try:
        cursor = connection.cursor()
        cursor.execute(
            "SELECT id, username, email, created_at FROM users WHERE id = %s",
            (user_id,)
        )
        
        user = cursor.fetchone()
        if user:
            return {
                "id": user[0],
                "username": user[1],
                "email": user[2],
                "created_at": user[3]
            }
        return None
    except Exception as e:
        print(f"Error retrieving user: {e}")
        return None
    finally:
        connection.close()

def update_user(user_id, username=None, password=None, email=None):
    """
    Update a user's information
    
    Args:
        user_id (int): The ID of the user to update
        username (str, optional): New username
        password (str, optional): New password
        email (str, optional): New email
        
    Returns:
        bool: True if update successful, False otherwise
    """
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Build the SET clause dynamically based on provided parameters
        updates = []
        params = []
        
        if username is not None:
            updates.append("username = %s")
            params.append(username)
        
        if password is not None:
            updates.append("password = %s")
            params.append(password)
        
        if email is not None:
            updates.append("email = %s")
            params.append(email)
        
        if not updates:
            return False
        
        # Add the user_id to params
        params.append(user_id)
        
        # Construct and execute the query
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
        cursor.execute(query, params)
        
        if cursor.rowcount > 0:
            connection.commit()
            return True
        else:
            connection.rollback()
            return False
    except Exception as e:
        connection.rollback()
        print(f"Error updating user: {e}")
        return False
    finally:
        connection.close()

def delete_user(user_id):
    """
    Delete a user from the database
    
    Args:
        user_id (int): The ID of the user to delete
        
    Returns:
        bool: True if deletion successful, False otherwise
    """
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        
        if cursor.rowcount > 0:
            connection.commit()
            return True
        else:
            connection.rollback()
            return False
    except Exception as e:
        connection.rollback()
        print(f"Error deleting user: {e}")
        return False
    finally:
        connection.close()

def get_all_users():
    """
    Get all users from the database
    
    Returns:
        list: List of user dictionaries
    """
    connection = get_db_connection()
    if not connection:
        return []
    
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id, username, email, created_at FROM users")
        
        users = []
        for user in cursor.fetchall():
            users.append({
                "id": user[0],
                "username": user[1],
                "email": user[2],
                "created_at": user[3]
            })
        
        return users
    except Exception as e:
        print(f"Error retrieving users: {e}")
        return []
    finally:
        connection.close() 