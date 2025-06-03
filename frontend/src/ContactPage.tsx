import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import Sidebar from './Sidebar'; // Import Sidebar

const ContactPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen); // Toggle function

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

  const bodyStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    backgroundColor: '#F0F4F8',
    color: '#334E68',
  };

  const inputStyle: React.CSSProperties = {
    border: '1px solid #A2B9CD',
    backgroundColor: '#F8F9FA',
  };

  const buttonPrimaryStyle: React.CSSProperties = {
    backgroundColor: '#6C91B7',
    transition: 'background-color 0.3s ease',
  };

  // Placeholder for form submission
  const handleContactSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: Implement actual contact form submission logic (e.g., API call)
    alert('Contact form submitted (not really, this is a placeholder).');
  };

  return (
    <div style={bodyStyle} className="min-h-screen flex flex-col items-center justify-center p-4 relative"> {/* Ensure page takes full height and allows for fixed positioning of button */}
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />

      {/* Hamburger button to open sidebar, positioned fixed like in ChatPage */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 text-[#334E68] text-3xl focus:outline-none z-30 p-2" // z-30 to be above sidebar overlay
        aria-label="Open sidebar"
      >
        <i className="fas fa-bars"></i>
      </button>

      {/* Main content container */}
      {/* Added pt-16 or similar padding if header/button is fixed and overlapping */}
      <div className="w-full max-w-3xl mx-auto p-8 rounded-lg shadow-xl mt-16 sm:mt-12" style={{ backgroundColor: '#E0E6EE' }}> {/* Adjusted top margin for button */}
        <h1 className="text-5xl md:text-6xl font-bold text-center mb-8 text-[#4A6B8A]">Contact Nebula</h1>

        <p className="text-center text-lg md:text-xl mb-10 text-[#5D7E9D]">
          Have a question, a project idea, or just want to say hello? I&apos;d love to hear from you!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-semibold mb-6 text-[#4A6B8A]">Get in Touch</h2>
            <ul className="space-y-4 text-lg text-[#5D7E9D]">
              <li>
                <i className="fas fa-envelope mr-3 text-[#6C91B7]"></i> Email: <a href="mailto:contact@nebula.com" className="hover:underline">contact@nebula.com</a>
              </li>
              <li>
                <i className="fas fa-phone mr-3 text-[#6C91B7]"></i> Phone: +1 (123) 456-7890
              </li>
              <li>
                <i className="fas fa-map-marker-alt mr-3 text-[#6C91B7]"></i> Location: Your City, Your Country
              </li>
            </ul>
            <div className="mt-8">
              <h3 className="text-2xl font-semibold mb-4 text-[#4A6B8A]">Connect on Socials</h3>
              <div className="flex space-x-6">
                <a href="#" className="text-[#6C91B7] hover:text-[#4A6B8A] transition-colors duration-200 text-3xl">
                  <i className="fab fa-linkedin"></i>
                </a>
                <a href="#" className="text-[#6C91B7] hover:text-[#4A6B8A] transition-colors duration-200 text-3xl">
                  <i className="fab fa-github"></i>
                </a>
                <a href="#" className="text-[#6C91B7] hover:text-[#4A6B8A] transition-colors duration-200 text-3xl">
                  <i className="fab fa-twitter"></i>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-semibold mb-6 text-[#4A6B8A]">Send a Message</h2>
            <form onSubmit={handleContactSubmit} className="space-y-6"> {/* Added onSubmit handler */}
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-[#5D7E9D] mb-1">Name:</label>
                <input type="text" id="contact-name" name="name" placeholder="Your Name"
                       className="mt-1 block w-full px-4 py-2 rounded-md focus:ring-2 focus:ring-[#6C91B7] focus:border-transparent" style={inputStyle} />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-[#5D7E9D] mb-1">Email:</label>
                <input type="email" id="contact-email" name="email" placeholder="Your Email"
                       className="mt-1 block w-full px-4 py-2 rounded-md focus:ring-2 focus:ring-[#6C91B7] focus:border-transparent" style={inputStyle} />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[#5D7E9D] mb-1">Message:</label>
                <textarea id="message" name="message" rows={5} placeholder="Your message..."
                           className="mt-1 block w-full px-4 py-2 rounded-md focus:ring-2 focus:ring-[#6C91B7] focus:border-transparent" style={inputStyle}></textarea>
              </div>
              <div className="text-center pt-4">
                <button type="submit"
                        className="text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#6C91B7] focus:ring-opacity-50" style={buttonPrimaryStyle}>
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>

        <p className="text-center text-sm mt-10 text-[#889AA4]">&copy; 2025 Nebula. All rights reserved.</p>
      </div>
    </div>
  );
};

export default ContactPage;
