from datetime import datetime

def generate_dynamic_password():
    """
    Generates the dynamic password based on the current date.
    Password is 'banana' + year from 42 years ago
    """
    # Get current year
    current_year = datetime.now().year
    
    # Calculate year 42 years ago
    past_year = current_year - 42
    
    # Concatenate with 'banana'
    return f"banana{past_year}"


def get_historical_year():
    """
    Returns the year from 42 years ago for display purposes.
    """
    current_year = datetime.now().year
    return current_year - 42
