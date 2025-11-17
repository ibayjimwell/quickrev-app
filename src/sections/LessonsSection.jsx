import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, ChevronDown, Eye, FolderOpen, Trash2, FileText, MoreVertical, Loader2, RefreshCw } from 'lucide-react';
import Loader from '../components/Loader'; // Assuming this import path is correct
import { useAuth } from '../context/AuthContext.jsx'; // Assuming this context is available
import { useNavigate } from 'react-router-dom';

// API endpoint from environment variables
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT; 

// Simple Menu Component
const LessonMenu = ({ lesson, onOpenReviewer, onDelete, onClose }) => (
    <div 
        className="absolute right-0 top-10 z-10 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        // Prevent menu click from closing the menu immediately (by stopping propagation)
        onClick={(e) => e.stopPropagation()} 
    >
        <div className="py-1">
            <button 
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => { onOpenReviewer(lesson); onClose(); }}
            >
                <Eye className="w-4 h-4 mr-3 text-indigo-500" /> View Reviewer
            </button>
            <button 
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => { onDelete(lesson.id); onClose(); }}
            >
                <Trash2 className="w-4 h-4 mr-3" /> Delete Lesson
            </button>
        </div>
    </div>
);


function LessonsSection() {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    const [lessons, setLessons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortByDate, setSortByDate] = useState('newest'); // 'newest' | 'oldest'
    const [sortByName, setSortByName] = useState('asc');    // 'asc' | 'desc'
    // State to track which lesson's menu is open (using file_id)
    const [openMenuId, setOpenMenuId] = useState(null); 

    // Close the menu if clicked outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if the click is outside any open menu
            if (openMenuId && event.target.closest('.lesson-menu-container') === null) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    // --- Data Fetching Logic ---
    const fetchLessons = useCallback(async () => {
        if (!isAuthenticated || !user?.$id) {
            setError('User not authenticated or ID missing.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const url = `${API_ENDPOINT}/cloud/file/list`;
            
            const response = await axios.get(url, {
                params: {
                    user_id: user.$id,
                    type: 'original' 
                }
            });

            if (response.data.success) {
                const fetchedLessons = response.data.files.map(file => ({
                    id: file.document_id, 
                    file_id: file.file_id, 
                    name: file.name,
                    uploadedDate: file.updated_at, 
                }));
                setLessons(fetchedLessons);
            } else {
                setError('Failed to load lessons from server.');
            }
        } catch (err) {
            console.error('Lesson Fetch Error:', err);
            setError(err.response?.data?.detail || 'Could not connect to the server or retrieve data.');
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user?.$id]);

    useEffect(() => {
        fetchLessons();
    }, [fetchLessons]);


    // --- Filtering and Sorting Logic ---
    const filteredLessons = lessons.filter(lesson =>
        lesson.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedLessons = [...filteredLessons].sort((a, b) => {
        const dateA = new Date(a.uploadedDate);
        const dateB = new Date(b.uploadedDate);
        
        if (sortByDate === 'newest') {
            if (dateA < dateB) return 1;
            if (dateA > dateB) return -1;
        } else if (sortByDate === 'oldest') {
            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;
        }

        if (sortByName === 'asc') {
            return a.name.localeCompare(b.name);
        } else {
            return b.name.localeCompare(a.name);
        }
    });

    // --- Handlers ---
    const handleOpenReviewer = (lesson) => {
        navigate(`/main/lesson/${lesson.file_id}`); // 🔥 NEW NAVIGATION
    };
    
    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this lesson?")) {
            setLessons(lessons.filter(lesson => lesson.id !== id));
            axios.delete(`${API_ENDPOINT}/cloud/file/delete`, {
                params: {
                    user_id: user.$id,
                    file_id: id
                }
            })
        }
    };
    
    const handleToggleMenu = (id, event) => {
        event.stopPropagation(); // Prevent the card click/reviewer open
        setOpenMenuId(openMenuId === id ? null : id);
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        try {
            return new Date(isoString).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch {
            return isoString.substring(0, 10);
        }
    };

    // --- Render Logic ---
    if (isLoading) {
        return <Loader />
    }
    
    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-md space-y-3">
                <p className="font-bold">Error loading lessons</p>
                <p className="text-sm">{error}</p>
                <button
                    onClick={fetchLessons}
                    className="inline-flex items-center px-3 py-1 border border-transparent rounded-lg text-sm font-medium text-red-700 bg-red-200 hover:bg-red-300 transition-colors"
                >
                    <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">My Lessons</h1>

            {/* Search and Sort Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Input */}
                <div className="relative col-span-1 md:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search lessons..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                                placeholder-gray-400 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Sort by Date Dropdown */}
                <div className="relative">
                    <select
                        className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-lg shadow-sm
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                                text-sm"
                        value={sortByDate}
                        onChange={(e) => setSortByDate(e.target.value)}
                    >
                        <option value="newest">Sort by Date (Newest)</option>
                        <option value="oldest">Sort by Date (Oldest)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </div>

                {/* Sort by Name Dropdown */}
                <div className="relative">
                    <select
                        className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-lg shadow-sm
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                                text-sm"
                        value={sortByName}
                        onChange={(e) => setSortByName(e.target.value)}
                    >
                        <option value="asc">Sort by Name (A-Z)</option>
                        <option value="desc">Sort by Name (Z-A)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </div>
            </div>

            {/* Lessons List */}
            <div className="space-y-4">
                {sortedLessons.length > 0 ? (
                sortedLessons.map((lesson) => (
                    <div
                        key={lesson.file_id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between
                                    bg-white border border-gray-100 p-4 rounded-lg shadow-sm hover:border-indigo-300 transition-all cursor-pointer relative lesson-menu-container"
                        onClick={() => handleOpenReviewer(lesson)} // Entire card opens reviewer
                    >
                        
                        {/* Lesson Info - FIXED: Used flex-auto for truncation */}
                        <div className="flex items-start mb-3 sm:mb-0 min-w-0 pr-12 sm:pr-4 flex-auto">
                            <FileText className="w-5 h-5 text-indigo-500 mr-3 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-grow">
                                {/* 'truncate' class applies ellipsis and 'title' attribute provides tooltip */}
                                <p 
                                    className="text-base font-semibold text-gray-900 truncate" 
                                    title={lesson.name} 
                                    onClick={(e) => e.stopPropagation()} 
                                >
                                    {lesson.name}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Uploaded: **{formatDate(lesson.uploadedDate)}**
                                </p>
                            </div>
                        </div>

                        {/* Actions/Menu Container */}
                        <div className="flex flex-wrap gap-2 flex-shrink-0 mt-3 sm:mt-0 items-center">
                            
                            {/* Desktop/Tablet Action Buttons (Only visible on MD screens and up) */}
                            <div className='hidden md:flex gap-2' onClick={(e) => e.stopPropagation()}>
                                <button 
                                    onClick={() => handleOpenReviewer(lesson)}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-lg text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
                                >
                                    <Eye className="w-4 h-4 mr-2" />Open Lesson
                                </button>
                                <button
                                    onClick={() => handleDelete(lesson.file_id)}
                                    className="inline-flex items-center p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                    aria-label={`Delete ${lesson.name}`}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            
                            {/* Context Menu Button (Hidden on MD screens and up) */}
                            <button
                                className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:bg-gray-100 transition-colors z-20 md:hidden"
                                onClick={(e) => handleToggleMenu(lesson.file_id, e)}
                                aria-expanded={openMenuId === lesson.file_id}
                                aria-controls={`menu-${lesson.file_id}`}
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>

                            {/* Context Menu */}
                            {openMenuId === lesson.file_id && (
                                <LessonMenu 
                                    lesson={lesson}
                                    onOpenReviewer={handleOpenReviewer}
                                    onDelete={handleDelete}
                                    onClose={() => setOpenMenuId(null)}
                                />
                            )}
                        </div>
                    </div>
                ))
                ) : (
                <div className="text-center py-10 text-gray-600 border border-gray-200 rounded-xl bg-gray-50">
                    No lessons found for the current search. Start by uploading a new lesson!
                </div>
                )}
            </div>

        </div>
    );
}

export default LessonsSection;