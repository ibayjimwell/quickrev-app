// src/components/SideBar.jsx (Revised)

import React from 'react';
import NavLink from './NavLink';
import { LayoutDashboard, BookOpen, FileText, GraduationCap } from 'lucide-react';
import UserProfileMenu from './UserProfileMenu'; // 👈 Import the new component

/**
 * @param {object} props
 * @param {boolean} props.isMenuOpen - Controls the sidebar's visibility on mobile.
 * @param {function} props.closeMenu - Function to close the mobile menu.
 * @param {string} props.currentPath - The current route path for link active state.
 */
function SideBar({ isMenuOpen, closeMenu, currentPath }) {
    return (
        <>
            <nav
                className={`fixed inset-y-0 left-0 transform ${
                isMenuOpen ? 'translate-x-0' : '-translate-x-full'
                } lg:translate-x-0 transition-transform duration-300 w-64 bg-white border-r border-gray-100 p-6 flex flex-col justify-between z-40 h-full shadow-lg`}
            >
                {/* TOP SECTION: Brand and Navigation */}
                <div>
                    {/* ... (Existing Brand/Logo and NavLink section is unchanged) ... */}
                    <div className="flex items-center mb-10 gap-4">
                        <img className='w-10 h-10' src="/icon.png" alt="QuickRev Icon" />
                        <h1 className="text-xl font-bold text-gray-900">QuickRev</h1>
                    </div>

                    {/* Navigation Links (Removed Settings from here) */}
                    <div className="space-y-1">
                        <NavLink 
                            icon={LayoutDashboard} 
                            label="Dashboard" 
                            to="/main/dashboard" 
                            isActive={currentPath === '/main/dashboard'}
                            onClick={closeMenu}
                        />
                        <NavLink 
                            icon={BookOpen} 
                            label="Lessons" 
                            to="/main/lessons"
                            isActive={currentPath === '/main/lessons'}
                            onClick={closeMenu}
                        />
                        <NavLink 
                            icon={GraduationCap}
                            label="Reviewers" 
                            to="/main/reviewers"
                            isActive={currentPath === '/main/reviewers'}
                            onClick={closeMenu}
                        />
                        <NavLink 
                            icon={FileText} 
                            label="Flashcards" 
                            to="/main/flashcards" 
                            isActive={currentPath === '/main/flashcards'}
                            onClick={closeMenu}
                        />
                         {/* Settings is now inside the user menu, so remove this NavLink */}
                         {/* <NavLink 
                            icon={Settings} 
                            label="Settings" 
                            to="/main/settings" 
                            isActive={currentPath === '/main/settings'}
                            onClick={closeMenu}
                        /> 
                        */}
                    </div>
                </div>

                {/* BOTTOM SECTION: Custom Card and User Profile */}
                <div className="mt-auto">
                    {/* Custom Card */}
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg mb-6">
                        <h3 className="text-sm font-semibold text-indigo-800 mb-1">New Feature: Flashcards</h3>
                        <p className="text-xs text-indigo-700 mb-4">
                            Generate comprehensive flashcards from your uploaded content instantly.
                        </p>
                        <button className="w-full py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                            Generate
                        </button>
                    </div>

                    {/* User Profile Menu */}
                    <UserProfileMenu 
                        closeMenu={closeMenu} 
                        currentPath={currentPath}
                    />
                </div>
            </nav>
        </>
    );
}

export default SideBar;