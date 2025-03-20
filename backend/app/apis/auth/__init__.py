from fastapi import APIRouter, HTTPException, Depends, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime, timedelta
import time
from jose import JWTError, jwt
from typing import Optional
import logging

# Utility functions for dynamic password generation
def get_historical_year() -> int:
    """
    Returns the year from 42 years ago based on the current date.
    """
    try:
        current_year = datetime.now().year
        past_year = current_year - 42
        print(f"Calculated historical year: {past_year} (Current year: {current_year})")
        return past_year
    except Exception as e:
        print(f"Error calculating historical year: {str(e)}")
        raise

def generate_dynamic_password() -> str:
    """
    Generates the dynamic password based on the current date.
    Password is 'banana' + year from 42 years ago
    """
    try:
        past_year = get_historical_year()
        password = f"banana{past_year}"
        # Avoid logging the full password in production
        print(f"Generated dynamic password with year {past_year}")
        return password
    except Exception as e:
        print(f"Error generating dynamic password: {str(e)}")
        raise

router = APIRouter(prefix="/api/auth")

# Security scheme for token authorization
security = HTTPBearer(auto_error=False)

# Secret key for JWT signing - in a real application, this should be stored securely
SECRET_KEY = "e5e9fa1ba31ecd1ae84f75caaa474f3a663f05f4"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

# Models for authentication
class LoginRequest(BaseModel):
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: int  # Unix timestamp

class TokenData(BaseModel):
    username: Optional[str] = None


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create a JWT access token with expiration time
    """
    try:
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        
        print(f"Created access token with expiry: {expire.isoformat()}")
        return encoded_jwt, int(expire.timestamp())
    except Exception as e:
        print(f"Error creating access token: {str(e)}")
        raise


def verify_password(provided_password: str) -> bool:
    """
    Verifies if the provided password matches the dynamic password for today.
    """
    try:
        expected_password = generate_dynamic_password()
        # Log for debugging but mask part of the password
        masked_expected = expected_password[:3] + "*" * (len(expected_password) - 6) + expected_password[-3:]
        masked_provided = provided_password[:3] + "*" * (len(provided_password) - 6) + provided_password[-3:] if len(provided_password) > 6 else "***"
        print(f"Password verification: Expected={masked_expected}, Provided={masked_provided}, Match={expected_password == provided_password}")
        return expected_password == provided_password
    except Exception as e:
        print(f"Error verifying password: {str(e)}")
        return False


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, response: Response):
    """
    Authenticate user with dynamic password system.
    Password is 'banana' + year from 42 years ago.
    """
    try:
        print(f"Login attempt received with password length: {len(request.password)}")
        
        # Check if the password matches the expected dynamic password
        if not verify_password(request.password):
            print("Password verification failed - incorrect password")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password. Please use the dynamic password formula.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        print("Password verification successful, generating token")
        
        # Generate JWT token for the user
        access_token, expires_at = create_access_token(
            data={"sub": "admin"}, 
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        # Set cookies for additional security
        response.set_cookie(
            key="access_token",
            value=f"Bearer {access_token}",
            httponly=True,
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            samesite="lax"
        )
        
        print(f"Token generated successfully, expires at: {datetime.fromtimestamp(expires_at)}")
        
        return LoginResponse(
            access_token=access_token,
            expires_at=expires_at
        )
    except HTTPException as he:
        # Re-raise HTTP exceptions directly
        raise he
    except Exception as e:
        print(f"Unexpected login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.get("/password-hint")
async def get_password_hint():
    """
    Provides a hint about the password format without revealing it.
    """
    try:
        past_year = get_historical_year()
        print(f"Providing password hint for year: {past_year}")
        
        return {
            "hint": f"The password is 'banana' + the year from 42 years ago ({past_year})"
        }
    except Exception as e:
        print(f"Error generating password hint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not generate password hint: {str(e)}"
        )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validate the user's JWT token and return the user data
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        if not credentials or not credentials.credentials:
            print("No token provided in request")
            raise credentials_exception
            
        # Log token validation attempt (without showing the actual token)
        print(f"Validating token (first 10 chars): {credentials.credentials[:10]}...")
        
        # Decode the JWT token
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            print("No username in token payload")
            raise credentials_exception
            
        # Check token expiration
        exp = payload.get("exp")
        if not exp or datetime.fromtimestamp(exp) < datetime.utcnow():
            print(f"Token expired at {datetime.fromtimestamp(exp) if exp else 'unknown'}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        print(f"Token validation successful for user: {username}")
        token_data = TokenData(username=username)
        return token_data
    except JWTError as e:
        print(f"JWT error during token validation: {str(e)}")
        raise credentials_exception
    except Exception as e:
        print(f"Unexpected error during token validation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}"
        )

# Protected route example that requires authentication
@router.get("/verify-token")
async def verify_token(current_user: TokenData = Depends(get_current_user)):
    """
    Verify if the provided token is valid
    """
    try:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        print(f"Token verification successful for user: {current_user.username}")
        return {
            "valid": True, 
            "username": current_user.username,
            "timestamp": datetime.utcnow().isoformat()
        }
    except HTTPException as he:
        # Re-raise HTTP exceptions directly
        raise he
    except Exception as e:
        print(f"Error in verify_token endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token verification failed: {str(e)}"
        )


