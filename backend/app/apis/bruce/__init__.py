from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, AsyncIterator
from datetime import datetime
import json
from groq import Groq
import databutton as db
import asyncio

router = APIRouter(prefix="/api/bruce")

# Initialize Groq client with the API key provided in the requirements
GROQ_API_KEY = "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"

# Message model for the conversation
class ChatMessageContent(BaseModel):
    role: str = Field(..., description="Role")
    content: str = Field(..., description="Content")
    timestamp: Optional[str] = Field(None, description="Timestamp")

# Request model for chat endpoint
class ChatRequest(BaseModel):
    messages: List[ChatMessageContent] = Field(..., description="Messages")
    stream: Optional[bool] = Field(False, description="Whether to stream the response")

# Response model for chat endpoint
class ChatResponse(BaseModel):
    message: ChatMessageContent

# History response model
class ConversationHistoryResponse(BaseModel):
    history: List[ChatMessageContent]

# Storage key for the conversation history
CONVERSATION_HISTORY_KEY = "bruce_conversation_history"

# System message for Bruce
SYSTEM_MESSAGE = """
You are Bruce, the CareConnect Tetris assistant. You help healthcare management staff with:

1. Scheduling and caregiver-client matching using the Tetris system
2. Managing caregiver applications and lifecycle
3. Processing client information and referrals
4. Using location-based matching with Google Places
5. Understanding system operations and troubleshooting issues

Your personality is professional but approachable. You're knowledgeable about healthcare operations, particularly home care, and you understand the complexities of matching caregivers to clients based on location, availability, and skills.

When asked about scheduling or matching, explain the Tetris-like system used to optimize caregiver schedules. When asked about applicants, explain the lifecycle from new applicant to available caregiver.

Important details about the system:
- Clients can have up to three shifts per day
- Caregivers need a minimum of 32 hours per week and can serve a maximum of two clients
- Matching is based on proximity (using Google Places data), availability, and shift timing
- The system functions like a game of Tetris, fitting caregiver availabilities to client shift requirements
- The scheduler re-optimizes shift schedules every 5 minutes

Provide concise, helpful responses that reflect your expertise in the CareConnect platform.
Never show your thinking process using <think> tags or similar. Always respond directly with the final answer.
"""

# Helper function to get conversation history
def get_conversation_history() -> List[ChatMessageContent]:
    """Retrieve the conversation history from storage"""
    try:
        history_data = db.storage.json.get(CONVERSATION_HISTORY_KEY, default=[])
        return [ChatMessageContent(**msg) for msg in history_data]
    except Exception as e:
        print(f"Error retrieving conversation history: {e}")
        return []

# Helper function to save conversation history
def save_conversation_history(history: List[ChatMessageContent]) -> None:
    """Save the conversation history to storage"""
    try:
        history_data = [msg.dict() for msg in history]
        db.storage.json.put(CONVERSATION_HISTORY_KEY, history_data)
    except Exception as e:
        print(f"Error saving conversation history: {e}")

@router.post("/chat", response_model=Dict)
def chat_with_bruce(request: ChatRequest):
    """Chat with Bruce (non-streaming version)"""
    if request.stream:
        # Do not execute this function if streaming is requested
        # The streaming endpoint will be used instead
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This endpoint does not support streaming. Use the streaming endpoint instead."
        )
    
    try:
        # Create Groq client
        client = Groq(api_key=GROQ_API_KEY)
        
        # Prepare messages with system prompt
        messages = [
            {"role": "system", "content": SYSTEM_MESSAGE}
        ]
        
        # Add user conversation history
        for msg in request.messages:
            if msg.role in ["user", "assistant"]:
                messages.append({"role": msg.role, "content": msg.content})
        
        # Call Groq API with the specified model
        completion = client.chat.completions.create(
            model="deepseek-r1-distill-llama-70b",
            messages=messages,
            temperature=0.6,
            max_tokens=8096,
            top_p=0.95,
            stream=False,
        )
        
        # Extract assistant's message
        response_content = completion.choices[0].message.content
        
        # Create response
        message = ChatMessageContent(
            role="assistant",
            content=response_content,
            timestamp=datetime.now().isoformat()
        )
        
        return {"message": message.dict()}
    
    except Exception as e:
        print(f"Error in chat_with_bruce: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get response from Bruce: {str(e)}"
        )

@router.post("/chat/stream", tags=["stream"])
async def chat_with_bruce_stream(request: ChatRequest) -> StreamingResponse:
    """Chat with Bruce (streaming version)"""
    if not request.stream:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This endpoint requires 'stream' to be set to true."
        )
    
    async def generate_stream() -> AsyncIterator[str]:
        try:
            # Create Groq client
            client = Groq(api_key=GROQ_API_KEY)
            
            # Prepare messages with system prompt
            messages = [
                {"role": "system", "content": SYSTEM_MESSAGE}
            ]
            
            # Add user conversation history
            for msg in request.messages:
                if msg.role in ["user", "assistant"]:
                    messages.append({"role": msg.role, "content": msg.content})
            
            # Call Groq API with streaming enabled
            completion = client.chat.completions.create(
                model="deepseek-r1-distill-llama-70b",
                messages=messages,
                temperature=0.6,
                max_tokens=8096,
                top_p=0.95,
                stream=True,
            )
            
            for chunk in completion:
                content = chunk.choices[0].delta.content
                if content:
                    # Stream the content chunk
                    yield content
                # Small delay to prevent overwhelming the client
                await asyncio.sleep(0.01)
                
        except Exception as e:
            print(f"Error in chat_with_bruce_stream: {e}")
            error_msg = f"Error: {str(e)}"
            yield error_msg
    
    return StreamingResponse(generate_stream(), media_type="text/plain")

@router.get("/history")
async def get_conversation_history_endpoint() -> ConversationHistoryResponse:
    """Get the conversation history"""
    history = get_conversation_history()
    return ConversationHistoryResponse(history=history)

@router.post("/history/add")
async def add_to_conversation_history(message: ChatMessageContent) -> Dict:
    """Add a message to the conversation history"""
    try:
        # Get existing history
        history = get_conversation_history()
        
        # Add the new message
        if not message.timestamp:
            message.timestamp = datetime.now().isoformat()
        
        history.append(message)
        
        # Save updated history
        save_conversation_history(history)
        
        return {"success": True, "message": "Message added to history"}
    except Exception as e:
        print(f"Error adding to conversation history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add message to history: {str(e)}"
        )

@router.post("/history/clear")
async def clear_conversation_history() -> Dict:
    """Clear the conversation history"""
    try:
        # Save an empty history
        save_conversation_history([])
        return {"success": True, "message": "Conversation history cleared"}
    except Exception as e:
        print(f"Error clearing conversation history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear conversation history: {str(e)}"
        )
