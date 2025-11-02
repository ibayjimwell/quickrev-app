// src/components/UserProfileMenu.jsx

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx'; 
import useClickOutside from '../hooks/useClickOutside.js'; // 👈 We'll create this hook

// Utility function to generate initials and a color
const generateInitialsAndColor = (name) => {
    // 1. Generate Initials (JD)
    const parts = name ? name.split(' ') : ['U', 'R'];
    const initials = (parts.length > 1) 
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : (parts[0][0] || 'U').toUpperCase();

    // 2. Generate Color based on initials (or email hash)
    // Simple hashing for a consistent color:
    const stringToHash = initials; 
    let hash = 0;
    for (let i = 0; i < stringToHash.length; i++) {
        hash = stringToHash.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 70%, 50%)`; // HSL for vibrant, distinct colors

    return { initials, color };
};

function UserProfileMenu({ closeMenu, currentPath }) {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useClickOutside(dropdownRef, () => setIsDropdownOpen(false));
    
    // User data extraction
    const userName = user?.name || user?.email.split('@')[0] || 'User';
    const userEmail = user?.email || 'N/A';
    
    // Generate initials and background color
    const { initials, color } = generateInitialsAndColor(userName);

    const handleLogout = () => {
        logout();
        closeMenu();
        setIsDropdownOpen(false);
    };

    return (
        <div ref={dropdownRef} className="relative">
            {/* --- User Profile Link / Toggle Button --- */}
            <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className={`w-full flex items-center p-2 -ml-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-100 
                    ${currentPath === '/main/settings' || isDropdownOpen ? 'bg-gray-100' : ''}`}
            >
                {/* Avatar with Initials */}
                <div 
                    className="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0"
                    style={{ backgroundColor: color }}
                >
                    {initials}
                </div>
                {/* User Info */}
                <div className="flex-grow text-left overflow-hidden">
                    <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                </div>
                {/* Dropdown Chevron */}
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>

            {/* --- Dropdown Menu --- */}
            {isDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50">
                    <Link
                        to="/main/settings"
                        className="flex items-center w-full p-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => { closeMenu(); setIsDropdownOpen(false); }}
                    >
                        <Settings className="w-4 h-4 mr-2 text-indigo-500" />
                        Settings
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full p-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Log Out
                    </button>
                </div>
            )}
        </div>
    );
}

export default UserProfileMenu;