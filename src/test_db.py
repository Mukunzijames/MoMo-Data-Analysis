import sys
import os

# Add the src directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.db_connection import test_connection
from src.database.schema import create_tables
from src.database.user_crud import create_user, get_user_by_id, update_user, delete_user, get_all_users

def test_user_crud():
    """
    Test the user CRUD operations
    """
    print("Testing user CRUD operations...")
    
    # Create a test user
    user_id = create_user("testuser", "password123", "test@example.com")
    if not user_id:
        print("Failed to create test user")
        return False
    
    print(f"Created user with ID: {user_id}")
    
    # Get the user by ID
    user = get_user_by_id(user_id)
    if not user:
        print("Failed to retrieve user")
        return False
    
    print(f"Retrieved user: {user}")
    
    # Update the user
    if not update_user(user_id, username="updateduser"):
        print("Failed to update user")
        return False
    
    print("Updated user successfully")
    
    # Get the updated user
    updated_user = get_user_by_id(user_id)
    if not updated_user or updated_user["username"] != "updateduser":
        print("Failed to retrieve updated user")
        return False
    
    print(f"Retrieved updated user: {updated_user}")
    
    # Get all users
    users = get_all_users()
    print(f"All users: {users}")
    
    # Delete the user
    if not delete_user(user_id):
        print("Failed to delete user")
        return False
    
    print("Deleted user successfully")
    
    # Verify user is deleted
    deleted_user = get_user_by_id(user_id)
    if deleted_user:
        print("User was not actually deleted")
        return False
    
    print("User CRUD tests passed successfully")
    return True

if __name__ == "__main__":
    # Test database connection
    if not test_connection():
        print("Database connection test failed. Make sure your .env file is set up correctly.")
        sys.exit(1)
    
    # Create tables
    if not create_tables():
        print("Failed to create database tables")
        sys.exit(1)
    
    # Test user CRUD operations
    if not test_user_crud():
        print("User CRUD tests failed")
        sys.exit(1)
    
    print("All tests completed successfully") 