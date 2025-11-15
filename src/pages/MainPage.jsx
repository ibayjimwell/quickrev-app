import React from 'react';
import { useLocation } from 'react-router-dom'; // 👈 Import useLocation
import Sidebar from '../components/SideBar';
import DashboardSection from '../sections/DashboardSection';
import LessonsSection from '../sections/LessonsSection';
import ReviewersSections from '../sections/ReviewersSections';
import FlashcardsSection from '../sections/FlashcardsSection';
import { Menu, X } from 'lucide-react';

// Placeholder Components (You'll replace these with your actual files)
const SettingsContent = () => <div className="p-4 text-gray-700"><h1>Settings ⚙️</h1><p>Update your account preferences.</p></div>;

function MainPage() {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const location = useLocation(); // 👈 Get the current location object
    const currentPath = location.pathname; // 👈 Extract the current path string

    // Function to determine which component to render
    const renderContent = () => {
        switch (currentPath) {
            case '/main/dashboard':
                return <DashboardSection />;
            case '/main/lessons':
                return <LessonsSection />;
            case '/main/reviewers':
                return <ReviewersSections />;
            case '/main/flashcards':
                return <FlashcardsSection />;
            case '/main/settings':
                return <SettingsContent />;
            default:
                return <DashboardSection />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            
            {/* Overlay for mobile menu */}
            {isMenuOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900 opacity-50 z-30 lg:hidden" 
                    onClick={() => setIsMenuOpen(false)}
                ></div>
            )}

            {/* Sidebar - Pass the current path to highlight the active link */}
            <Sidebar isMenuOpen={isMenuOpen} currentPath={currentPath} />

            {/* Main Content Area */}
            <div className="lg:ml-64 p-4 sm:p-6 transition-all duration-300">
                
                {/* Mobile Header and Hamburger Menu */}
                <header className="flex justify-between items-center py-4 mb-4 lg:hidden">
                    {/* Center: Title/Logo */}
                    <div className="flex items-center space-x-2">
                        <img className='w-10 h-10' src="/icon.png" alt="QuickRev Icon" />
                        <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                            Quick<span className="text-indigo-600">Rev</span>
                        </span>
                    </div>
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Toggle Menu"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </header>

                {/* Content - Renders based on the current route */}
                <main>
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}

export default MainPage;