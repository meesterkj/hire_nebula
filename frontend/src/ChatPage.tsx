import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar'; // Import Sidebar
import { Message } from './models'; // Assuming Message interface might be shared
import { v4 as uuidv4 } from 'uuid'; // Added uuid import

// If Message is not shared, define it here:
// interface Message {
//   id: string;
//   text: string;
//   sender: 'user' | 'ai';
// }

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar
  const [userId, setUserId] = useState<string | null>(null); // Added userId state

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen); // Toggle function

  // Effect for userId initialization
  useEffect(() => {
    let storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      storedUserId = uuidv4();
      localStorage.setItem('userId', storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  // Effect for body overflow
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto'; // Cleanup on unmount
    };
  }, [isSidebarOpen]);

  // Basic style for body - consider moving to global styles or Layout component
  const bodyStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    backgroundColor: '#F0F8F8',
    color: '#334E68',
  };

  // Initial AI Greeting
  useEffect(() => {
    setMessages([
      { id: Date.now().toString(), text: "Hi there! I'm Nebula's AI cheerleader. You may say that I am \"Agentic\", but still quite limited in what I can do. <br> How can I help you get to know Nebula better today? <br><br> You can ask me about Nebula's skills, passion and past experiences, which I will Retrieve from his CV supplied to me in pdf format, chunked and stored in an in-memory VectorDB. I RETRIEVE! WOOHOO! <br><br> You can also pass me an URL to job description on websites, which I will fetch through tool calling and help you understand how Nebula might be able to help you. OUF, I'm so freaking AGENTIC! <br><br> Ask me something about Nebula to get started.", sender: 'ai', timestamp: new Date() }
    ]);
  }, []);

  // Auto-scrolling
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    const userMessage: Message = { id: Date.now().toString(), text: inputValue, sender: 'user', timestamp: new Date() };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    setInputValue('');

    // Actual API call
    if (!userId) {
      console.error("User ID not set, cannot send message.");
      // Optionally, show an error to the user or queue the message.
      // For now, just preventing the call.
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Error: User session not properly initialized. Please refresh the page.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, errorResponse]);
      return;
    }

    fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: userId, message: userMessage.text }), // Used userId state
    })
    .then(response => response.json())
    .then(data => {
      if (data.response) {
        const aiResponse: Message = { id: (Date.now() + 1).toString(), text: data.response, sender: 'ai', timestamp: new Date() };
        setMessages(prevMessages => [...prevMessages, aiResponse]);
      } else {
        console.error('AI response not found in data:', data);
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I received an unexpected response from the AI. Please try again later.",
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prevMessages => [...prevMessages, errorResponse]);
      }
    })
    .catch(error => {
      console.error('Error fetching AI response:', error);
      // Optionally, handle this case in the UI, e.g., show an error message
      // For example, you could add a message to the chat indicating the error:
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't connect to the AI. Please try again later.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, errorResponse]);
    });
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div style={bodyStyle} className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />

      {/* Hamburger button to open sidebar */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 text-[#334E68] text-3xl focus:outline-none z-30 p-2" // Ensure button is accessible, z-30 to be above sidebar overlay
        aria-label="Open sidebar"
      >
        <i className="fas fa-bars"></i>
      </button>

      {/* Main chat area */}
      {/* Added pt-16 or similar padding to main content div if header/button is fixed and overlapping */}
      <div className="flex-grow flex flex-col p-4 md:p-8 relative pt-16 sm:pt-8"> {/* Adjusted top padding */}

        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-[#4A6B8A]">Get to know Nebula</h1>

        <div className="flex-grow bg-white rounded-lg shadow-xl p-6 flex flex-col overflow-hidden">
          <div id="chat-history" ref={chatHistoryRef} className="flex-grow overflow-y-auto p-4 space-y-4 flex flex-col">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`max-w-[70%] p-3 rounded-2xl mb-4 break-words shadow-md
                            ${msg.sender === 'user'
                              ? 'bg-yellow-100 self-end rounded-br-lg'
                              : 'bg-green-100 self-start rounded-bl-lg'
                            }`}
              >
                {msg.sender === 'ai' ? (
                  <span dangerouslySetInnerHTML={{ __html: msg.text }} />
                ) : (
                  msg.text
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center p-2 bg-gray-50 rounded-full shadow-inner">
            <input
              type="text"
              id="chat-input"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-grow px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#6C91B7] bg-transparent text-[#334E68]"
            />
            <button
              onClick={handleSendMessage}
              className="ml-3 bg-[#6C91B7] text-white p-3 rounded-full shadow-md hover:bg-[#4A6B8A] transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-[#6C91B7] focus:ring-opacity-50"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
