import os
import httpx
from typing import List, Optional, TypedDict, Annotated
from operator import itemgetter

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI # Reverted to Google
from langchain_community.vectorstores import FAISS
# Removed OpenAIEmbeddings and ChatAnthropic imports as they are no longer used
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage, SystemMessage
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
# from langgraph.checkpoint.sqlite import SqliteSaver # For more robust history/state if needed later
from langchain_experimental.pydantic_v1 import BaseModel, Field # Use v1 for Langchain compatibility

from ..core.config import settings
import glob

# --- PDF Processing and Vector Store (from previous step) ---
vector_store_instance: Optional[FAISS] = None

def load_and_process_pdfs():
    global vector_store_instance
    if vector_store_instance is not None:
        print("Vector store already initialized.")
        return vector_store_instance

    pdf_directory = "pdf/"
    pdf_files = glob.glob(os.path.join(pdf_directory, "*.pdf"))
    if not pdf_files:
        print("No PDF files found. Vector store will be empty or not initialized.")
        documents = []
    else:
        all_docs = []
        for pdf_path in pdf_files:
            try:
                loader = PyPDFLoader(pdf_path)
                docs = loader.load()
                all_docs.extend(docs)
            except Exception as e:
                print(f"Error loading PDF {pdf_path}: {e}")

        if not all_docs: documents = []
        else:
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            documents = text_splitter.split_documents(all_docs)
            print(f"Split into {len(documents)} chunks.")

    if not documents:
        print("No documents to process. Vector store cannot be created.")
        vector_store_instance = None
        return None

    try:
        print(f"Initializing GoogleGenerativeAIEmbeddings with API key: {settings.GOOGLE_API_KEY[:15]}...") # Reverted
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=settings.GOOGLE_API_KEY) # Reverted
        vector_store_instance = FAISS.from_documents(documents, embeddings)
        print("FAISS vector store created with Google embeddings.") # Reverted
    except Exception as e:
        print(f"Error during embedding or FAISS creation: {e}")
        vector_store_instance = None

    return vector_store_instance

def get_vector_store():
    return vector_store_instance

# --- Tool Definition ---
class FetchWebsiteArgs(BaseModel):
    url: str = Field(..., description="The URL of the website to fetch content from, specifically for a job description.")

@tool("fetch_job_description_content", args_schema=FetchWebsiteArgs)
def fetch_website_content(url: str) -> str:
    '''Fetches plain text content from a given URL, intended for job descriptions.
    Args: url (str): The URL of the job description.
    Returns: str: The text content of the page or an error message.
    '''
    try:
        print(f"Fetching website content from URL: {url}")
        # Some websites block default user-agents, so use a common one.
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        with httpx.Client(timeout=10.0, follow_redirects=True) as client:
            response = client.get(url, headers=headers)
            response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)
            # Basic content extraction, could be improved with BeautifulSoup for complex sites
            # For now, assume it's mostly text or use response.text directly.
            # Let's try to get text, might need a more sophisticated parser for complex HTML.
            # For now, just returning .text is fine.
            print(f"Successfully fetched content from {url}.") # Get text with newlines for readability
            return response.text
    except httpx.HTTPStatusError as e:
        print(f"HTTP error fetching {url}: {e.response.status_code} - {e.response.text}")
        return f"Error: Could not fetch content due to HTTP status {e.response.status_code}."
    except httpx.RequestError as e:
        print(f"Request error fetching {url}: {e}")
        return f"Error: Could not fetch content from URL {url}. Request failed: {type(e).__name__}"
    except Exception as e:
        print(f"Unexpected error fetching {url}: {e}")
        return f"Error: An unexpected error occurred while fetching content from {url}."

# --- LangGraph State Definition ---
class GraphState(TypedDict):
    messages: List[BaseMessage]
    retrieved_docs: Optional[List[str]] # Storing content of docs
    job_url: Optional[str] # If user provides a URL for a job
    # user_info: Optional[dict] # Example: {"name": "John Doe"}
    # Store the invocation of the tool to pass back to the LLM
    tool_invocations: Optional[List[ToolMessage]]


# --- LangGraph Nodes ---
def retrieve_documents_node(state: GraphState):
    print("---NODE: Retrieving documents---")
    current_user_message = state["messages"][-1].content
    docs_found = []
    if vector_store_instance:
        try:
            retrieved = vector_store_instance.similarity_search(current_user_message, k=3)
            docs_found = [doc.page_content for doc in retrieved]
            print(f"Retrieved {len(docs_found)} documents.")
        except Exception as e:
            print(f"Error during similarity search: {e}")
    else:
        print("Vector store not available for retrieval.")
    return {"retrieved_docs": docs_found}

def llm_call_node(state: GraphState):
    print("---NODE: Calling LLM---")
    # Construct prompt
    system_prompt_template = (
        "You are Nebula's AI assistant. Your goal is to help users get to know Nebula better. "
        "You should be friendly, helpful, and informative. "
        "Use the provided context from Nebula's documents and any job description to answer questions. "
        "If you are asked to look up a job description from a URL, use the 'fetch_job_description_content' tool. "
        "Do not make up information if it's not in the context or job description. "
        "If you don't know the answer, say so. "
        "Relevant context from Nebula's documents:\n{context}\n\n"
        "Job description (if provided by user and fetched):\n{job_description}\n\n"
        "Begin!"
    )

    context_str = "\n".join(state.get("retrieved_docs") or [])
    job_desc_str = ""
    if state.get("tool_invocations"):
        # If tool was called, its output is in tool_invocations
        # We assume the LLM will incorporate this when it processes the ToolMessage
        # So, we don't explicitly put tool_invocations content into job_desc_str for the *next* prompt here.
        # The history (state["messages"]) will contain the ToolMessage.
        # However, if we want to display it in the prompt for clarity or if the LLM needs it explicitly:
        tool_outputs_str = "\n".join([msg.content for msg in state.get("tool_invocations", []) if isinstance(msg, ToolMessage)])
        if tool_outputs_str:
             job_desc_str = tool_outputs_str # Or combine with previous job_url content if any

    current_prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=system_prompt_template.format(context=context_str, job_description=job_desc_str)),
        MessagesPlaceholder(variable_name="messages") # For history and current tool messages
    ])

    if state.get("tool_invocations"):
        current_prompt = current_prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=system_prompt_template.format(context=context_str, job_description=job_desc_str)),
    ])

    # Initialize LLM with tools
    # Ensure GOOGLE_API_KEY is available
    if not settings.GOOGLE_API_KEY or settings.GOOGLE_API_KEY == "your_google_api_key_here": # Reverted
        print("ERROR: GOOGLE_API_KEY not configured. LLM call will fail.") # Reverted
        # Return a message indicating this failure.
        ai_response = AIMessage(content="I cannot process your request right now as my connection to the language model is not configured (API key missing). Please contact support.")
        return {"messages": state["messages"] + [ai_response]}

    llm = ChatGoogleGenerativeAI( # Reverted to ChatGoogleGenerativeAI
        model="gemini-pro", # Reverted model
        google_api_key=settings.GOOGLE_API_KEY, # Reverted API key
        convert_system_message_to_human=True # Reinstated
    )
    llm_with_tools = llm.bind_tools([fetch_website_content], tool_choice=None) # None means LLM decides

    chain = current_prompt | llm_with_tools

    # The 'messages' in state should already include previous turns and the latest user message.
    # If a tool was called, the ToolMessage should also be in 'messages'.
    print(f"LLM Input Messages: {state['messages']}")
    try:
        response_message = chain.invoke({"messages": state["messages"]}) # LangGraph manages history
        print(f"LLM Raw Response: {response_message}")
    except Exception as e:
        print(f"Error calling LLM: {e}")
        # This could be due to API key issues, model errors, etc.
        response_message = AIMessage(content=f"Sorry, I encountered an error trying to process your request with the language model: {e}")

    return {"messages": state["messages"] + [response_message]} # Add LLM's response to history


def tool_node(state: GraphState) -> dict:
    print("---NODE: Executing Tool---")
    tool_invocations_results = []
    # The LLM response is the last message. Check if it has tool calls.
    last_message = state["messages"][-1]
    if not hasattr(last_message, 'tool_calls') or not last_message.tool_calls:
        print("No tool calls found in LLM response.")
        return {"tool_invocations": []} # Or handle as no-op

    for tool_call in last_message.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        print(f"Executing tool: {tool_name} with args: {tool_args}")
        if tool_name == "fetch_job_description_content":
            # Ensure args is a dict, sometimes it might be a string that needs parsing
            # Pydantic in @tool decorator should handle this if input is from LLM
            url = tool_args.get("url")
            if url:
                content = fetch_website_content.invoke({"url": url}) # Invoke the tool correctly
                tool_invocations_results.append(
                    ToolMessage(content=content, tool_call_id=tool_call["id"], name=tool_name)
                )
            else:
                tool_invocations_results.append(
                    ToolMessage(content="Error: URL not provided for fetching job description.", tool_call_id=tool_call["id"], name=tool_name)
                )
        else:
            # Handle other tools or unknown tools
            tool_invocations_results.append(
                ToolMessage(content=f"Error: Unknown tool '{tool_name}' called.", tool_call_id=tool_call["id"], name=tool_name)
            )

    print(f"Tool invocation results: {tool_invocations_results}")
    return {"tool_invocations": tool_invocations_results}


# --- Conditional Edges ---
def should_continue(state: GraphState) -> str:
    print("---EDGE: Deciding to continue or end---")
    # Check if the last AI message (from llm_call_node) has tool calls
    last_message = state["messages"][-1]
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        print("Tool call detected, routing to tool_node.")
        return "use_tool"
    else:
        print("No tool call, ending graph.")
        return END

# --- Graph Assembly ---
class ChatService:
    def __init__(self):
        self.graph = self._build_graph()

    def _build_graph(self):
        graph_builder = StateGraph(GraphState)

        graph_builder.add_node("retrieve_docs", retrieve_documents_node)
        graph_builder.add_node("llm_call", llm_call_node)
        graph_builder.add_node("tool_executor", tool_node)

        graph_builder.set_entry_point("retrieve_docs")

        graph_builder.add_edge("retrieve_docs", "llm_call")

        graph_builder.add_conditional_edges(
            "llm_call", # Source node
            should_continue, # Function to decide next path
            {
                "use_tool": "tool_executor", # If should_continue returns "use_tool"
                END: END  # If should_continue returns END
            }
        )
        graph_builder.add_edge("tool_executor", "llm_call") # Output of tool goes back to LLM

        # memory = SqliteSaver.from_conn_string(":memory:") # In-memory SQLite for checkpoints
        # compiled_graph = graph_builder.compile(checkpointer=memory)
        compiled_graph = graph_builder.compile() # Compile without checkpointer for now for simplicity
        print("LangGraph compiled.")
        return compiled_graph

    def process_message(self, user_id: str, user_message_content: str, current_history: List[BaseMessage]):
        print(f"Processing message for user_id: {user_id}, message: '{user_message_content}'")

        # Append current user message to the history passed in
        updated_history = current_history + [HumanMessage(content=user_message_content)]

        graph_input = {"messages": updated_history}

        # For graphs with checkpointers, config is important for threading conversations
        # config = {"configurable": {"thread_id": str(user_id)}}
        # For now, without checkpointer, config is not strictly needed for thread_id unless graph uses it.

        try:
            # response_state = self.graph.invoke(graph_input, config=config)
            response_state = self.graph.invoke(graph_input) # Invoke without config if no checkpointer
            final_messages = response_state.get("messages", [])
            if final_messages and isinstance(final_messages[-1], AIMessage):
                ai_response_content = final_messages[-1].content
                # The history for the *next* turn should include the AI's response.
                # The caller of process_message will be responsible for updating their stored history.
                # We return the AI's response and the full history of *this* turn.
                return ai_response_content, final_messages
            else:
                return "Error: Could not get a valid AI response.", final_messages
        except Exception as e:
            print(f"Error invoking LangGraph: {e}")
            import traceback
            traceback.print_exc()
            return f"Sorry, an error occurred while processing your request: {e}", updated_history


# Global instance, initialized on startup
chat_service_instance: Optional[ChatService] = None

def initialize_chat_service():
    global chat_service_instance
    # Reverted to check for GOOGLE_API_KEY as it's now the primary LLM
    if not settings.GOOGLE_API_KEY or settings.GOOGLE_API_KEY == "your_google_api_key_here":
        print("WARNING: GOOGLE_API_KEY is not set. Chat service LLM calls will fail.")
        # We can still initialize the service, but it will return errors.

    # Ensure vector store is loaded before ChatService initialization if it depends on it
    # load_and_process_pdfs() # This is called in main.py lifespan already

    print("Initializing ChatService...")
    chat_service_instance = ChatService()
    print("ChatService initialized.")

def get_chat_service():
    if chat_service_instance is None:
        # This might happen if accessed before lifespan event, or if init failed.
        # For robustness, could try initializing here, but better to ensure it's done in lifespan.
        print("Warning: ChatService accessed before full initialization.")
        # initialize_chat_service() # Avoid re-init if it's complex or stateful beyond this
    return chat_service_instance
