import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const IndexPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(''); // Clear previous errors

    // Input Validation
    if (!name.trim() || !email.trim() || !organisation.trim() || !position.trim()) {
      setError('All fields are required.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    // API Call
    fetch('http://localhost:8000/api/chat/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, organisation, position }),
    })
    .then(response => {
      if (!response.ok) {
        // Try to parse error response, otherwise throw generic error
        return response.json().then(errData => {
          throw new Error(errData.message || `Server responded with ${response.status}`);
        }).catch(() => {
          throw new Error(`Server responded with ${response.status}`);
        });
      }
      return response.json();
    })
    .then(data => {
      if (data.userID) {
        // Potentially store userID if needed later, e.g., in localStorage
        // localStorage.setItem('userID', data.userID);
        navigate('/chat');
      } else {
        setError(data.message || 'Failed to start chat. Please try again.');
      }
    })
    .catch(err => {
      console.error('Failed to start chat:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#F0F4F8', color: '#334E68' }}>
      <div className="w-full max-w-2xl mx-auto p-8 rounded-lg shadow-xl" style={{ backgroundColor: '#E0E6EE' }}>
        <h1 className="text-5xl md:text-6xl font-bold text-center mb-8 text-[#4A6B8A]">Have you met Nebula?</h1>

        <p className="text-center text-lg md:text-xl mb-10 text-[#5D7E9D]">
          Welcome to the AI that will try to convince you to hire Nebula.
        </p>

        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
          <h2 className="text-3xl font-semibold text-center mb-6 text-[#4A6B8A]">Start by telling me who you are</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#5D7E9D] mb-1">Name:</label>
              <input type="text" id="name" name="name" placeholder="Your Name"
                     value={name} onChange={(e) => setName(e.target.value)}
                     className="mt-1 block w-full px-4 py-2 rounded-md focus:ring-2 focus:ring-[#6C91B7] focus:border-transparent" style={{ border: '1px solid #A2B9CD', backgroundColor: '#F8F9FA' }} />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#5D7E9D] mb-1">Email:</label>
              <input type="email" id="email" name="email" placeholder="Your Email"
                     value={email} onChange={(e) => setEmail(e.target.value)}
                     className="mt-1 block w-full px-4 py-2 rounded-md focus:ring-2 focus:ring-[#6C91B7] focus:border-transparent" style={{ border: '1px solid #A2B9CD', backgroundColor: '#F8F9FA' }} />
            </div>
            <div>
              <label htmlFor="organisation" className="block text-sm font-medium text-[#5D7E9D] mb-1">Organisation:</label>
              <input type="text" id="organisation" name="organisation" placeholder="Your Organisation"
                     value={organisation} onChange={(e) => setOrganisation(e.target.value)}
                     className="mt-1 block w-full px-4 py-2 rounded-md focus:ring-2 focus:ring-[#6C91B7] focus:border-transparent" style={{ border: '1px solid #A2B9CD', backgroundColor: '#F8F9FA' }} />
            </div>
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-[#5D7E9D] mb-1">Position:</label>
              <input type="text" id="position" name="position" placeholder="Your Position"
                     value={position} onChange={(e) => setPosition(e.target.value)}
                     className="mt-1 block w-full px-4 py-2 rounded-md focus:ring-2 focus:ring-[#6C91B7] focus:border-transparent" style={{ border: '1px solid #A2B9CD', backgroundColor: '#F8F9FA' }} />
            </div>
            {error && <p className="text-red-500 text-center text-sm">{error}</p>}
            <div className="text-center pt-4">
              <button type="submit"
                      className="button-primary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#6C91B7] focus:ring-opacity-50" style={{ backgroundColor: '#6C91B7', transition: 'background-color 0.3s ease' }}>
                Enter &rarr;
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-sm mt-10 text-[#889AA4]">&copy; 2025 Nebula. All rights reserved. Whatever that means...</p>
      </div>
    </div>
  );
};

export default IndexPage;
