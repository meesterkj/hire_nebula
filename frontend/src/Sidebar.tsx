import React from 'react';
import { Link } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle }) => {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-10 ${isOpen ? 'block' : 'hidden'}`}
        onClick={toggle}
      ></div>

      {/* Sidebar */}
      <div
        id="sidebar"
        className={`sidebar fixed top-0 left-0 h-full bg-white shadow-lg p-6 flex flex-col w-64 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-20`}
        style={{fontFamily: 'Inter, sans-serif'}} // Added base font style
      >
        <div className="flex justify-end mb-8">
          <button onClick={toggle} className="text-[#334E68] text-2xl focus:outline-none"> {/* Original text color */}
            <i className="fas fa-times"></i>
          </button>
        </div>
        <nav className="flex-grow">
          <ul>
            <li className="mb-4">
              {/* Placeholder for CV download, actual file will be added in a later step */}
              <a
                href="/sample_cv.pdf" // Corrected to match file in public folder
                download="sample_cv.pdf" // Corrected to match file in public folder
                className="text-lg font-semibold text-[#4A6B8A] hover:text-[#6C91B7] transition-colors duration-200"
                onClick={toggle} // Close sidebar on click
              >
                <i className="fas fa-download mr-3"></i> Download CV
              </a>
            </li>
            <li className="mb-4">
              <Link
                to="/chat"
                className="text-lg font-semibold text-[#4A6B8A] hover:text-[#6C91B7] transition-colors duration-200"
                onClick={toggle} // Close sidebar on click
              >
                <i className="fas fa-comments mr-3"></i> Chat
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="text-lg font-semibold text-[#4A6B8A] hover:text-[#6C91B7] transition-colors duration-200"
                onClick={toggle} // Close sidebar on click
              >
                <i className="fas fa-envelope mr-3"></i> Contact
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
