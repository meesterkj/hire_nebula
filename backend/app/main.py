from fastapi import FastAPI, Depends, HTTPException
from contextlib import asynccontextmanager
from typing import List, Dict, Optional

from . import models
# Removed SQLAlchemy imports: SessionLocal, engine, create_db_and_tables, get_db
# Removed sqlalchemy.orm.Session import
from .services import chat_service # Imports the whole module
from .core.config import settings # For API key check before init

# Langchain message types for history
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

# In-memory storage for chat histories (user_id -> List[BaseMessage])
# In a production app, this should be a more persistent store (Redis, DB, etc.)
chat_histories: Dict[str, List[BaseMessage]] = {}

# In-memory storage for users (email -> User model)
in_memory_users_db: Dict[str, models.User] = {}
next_user_id: int = 1
# import threading # For future thread safety if needed
# user_id_lock = threading.Lock()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application startup...")
    # Removed create_db_and_tables() call

    # Initialize PDF processing and vector store
    chat_service.load_and_process_pdfs()
    print("PDF processing attempted.")

    # Initialize ChatService (which builds the LangGraph)
    if not settings.GOOGLE_API_KEY or settings.GOOGLE_API_KEY == "your_google_api_key_here":
        print("CRITICAL WARNING: GOOGLE_API_KEY is not set in environment or .env file.")
        print("Chat functionality will be severely impaired or non-functional.")
    chat_service.initialize_chat_service()
    print("Chat service initialized.")

    yield
    print("Application shutdown...")

app = FastAPI(lifespan=lifespan)

@app.post("/chat/start", response_model=models.UserResponse)
def start_chat(user_data: models.UserCreate): # Removed db: Session = Depends(get_db)
    global next_user_id, in_memory_users_db

    if user_data.email in in_memory_users_db:
        existing_user = in_memory_users_db[user_data.email]
        print(f"Existing user found: {existing_user.userID}")
        # Ensure all fields are populated for the response
        return models.UserResponse(
            userID=existing_user.userID,
            name=existing_user.name,
            email=existing_user.email,
            organisation=existing_user.organisation,
            position=existing_user.position
        )

    # with user_id_lock: # If using threading.Lock
    current_id = next_user_id
    next_user_id += 1

    new_user = models.User(
        userID=current_id, # Assign the new userID
        name=user_data.name,
        email=user_data.email,
        organisation=user_data.organisation,
        position=user_data.position
    )
    in_memory_users_db[new_user.email] = new_user
    print(f"New user created with ID: {new_user.userID}")

    return models.UserResponse(
        userID=new_user.userID,
        name=new_user.name,
        email=new_user.email,
        organisation=new_user.organisation,
        position=new_user.position
    )

# Pydantic model for /chat request
class ChatRequest(BaseModel):
    message: str
    userId: int # Changed from userID to userId to match frontend examples if any, stick to camelCase

class ChatResponse(BaseModel):
    response: str
    history: List[Dict] # For frontend to reconstruct (sender, text)

def convert_messages_to_dict(messages: List[BaseMessage]) -> List[Dict]:
    output = []
    for msg in messages:
        if isinstance(msg, HumanMessage):
            output.append({"sender": "user", "text": msg.content})
        elif isinstance(msg, AIMessage):
            # Filter out tool calls from what's sent to frontend as AI 'text'
            if msg.tool_calls:
                 # If there's content, show it. If only tool calls, maybe a generic message or nothing.
                text_content = msg.content if isinstance(msg.content, str) else "Thinking..."
                output.append({"sender": "bot", "text": text_content, "tool_calls": True})
            else:
                output.append({"sender": "bot", "text": msg.content})
        # ToolMessage is not directly shown to user, it's part of the AI's internal thought process
    return output

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest): # Removed db: Session = Depends(get_db)
    user_id_str = str(request.userId)
    user_message_content = request.message

    if not user_id_str or not user_message_content:
        raise HTTPException(status_code=400, detail="userId and message are required")

    # Retrieve or initialize chat history for the user
    current_history = chat_histories.get(user_id_str, [])

    # Get the chat service instance
    service = chat_service.get_chat_service()
    if not service:
        raise HTTPException(status_code=503, detail="Chat service is not available.")

    ai_response_content, updated_history = service.process_message(
        user_id=user_id_str,
        user_message_content=user_message_content,
        current_history=current_history
    )

    # Store the updated history
    chat_histories[user_id_str] = updated_history

    return ChatResponse(
        response=ai_response_content,
        history=convert_messages_to_dict(updated_history) # Send full history for this turn
    )

@app.get("/")
def read_root():
    return {"message": "Welcome to Nebula AI Chat API - V2 with LangGraph"}
