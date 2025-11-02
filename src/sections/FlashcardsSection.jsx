// src/components/FlashcardsSection.jsx (FINAL REVISION with Error Fix and Data Fetching)

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, ChevronDown, Trash2, Zap, Clock, RefreshCw } from 'lucide-react';
import Loader from '../components/Loader'; // Assuming this import path is correct
import { useAuth } from '../context/AuthContext.jsx'; // Assuming this context is available

// API endpoint from environment variables
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT; 
const FLASHCARD_FILE_TYPE = "flashcards"; // The specific type to request

const FlashcardsSection = () => {
    const { user, isAuthenticated } = useAuth();
    
    const [flashcards, setFlashcards] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortByDate, setSortByDate] = useState('newest'); // 'newest' | 'oldest'
    const [sortByName, setSortByName] = useState('asc');    // 'asc' | 'desc'
    
    // Helper function to safely determine the source text
    const getSourceText = useCallback((file) => {
        const sourceId = file.source_file_id;
        
        // Check if sourceId exists before using substring
        if (sourceId) {
            // Display a truncated version of the ID for now, as we don't have the name
            return `Lesson Source (ID: ${sourceId.substring(0, 4)}...)`;
        }
        return 'Lesson Source (N/A)'; // Fallback when the ID is missing
    }, []);

    // Helper function to format the ISO date string
    const formatDate = useCallback((isoString) => {
        if (!isoString) return 'N/A';
        try {
            return new Date(isoString).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch {
            return isoString ? isoString.substring(0, 10) : 'N/A';
        }
    }, []);


    // --- Data Fetching Logic ---
    const fetchFlashcards = useCallback(async () => {
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
                    type: FLASHCARD_FILE_TYPE
                }
            });

            if (response.data.success) {
                const fetchedFlashcards = response.data.files.map(file => ({
                    id: file.document_id,
                    file_id: file.file_id, 
                    name: file.name,
                    generatedDate: file.updated_at,
                    source_file_id: file.source_file_id,
                    source: getSourceText(file) // Use the safe helper function
                }));
                setFlashcards(fetchedFlashcards);
            } else {
                setError('Failed to load flashcard sets from server.');
            }
        } catch (err) {
            console.error('Flashcard Fetch Error:', err);
            setError(err.response?.data?.detail || 'Could not connect to the server or retrieve data.');
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user?.$id, getSourceText]);


    useEffect(() => {
        fetchFlashcards();
    }, [fetchFlashcards]);


    // --- Filtering and Sorting Logic ---
    const filteredFlashcards = flashcards.filter(flashcard =>
        flashcard.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedFlashcards = [...filteredFlashcards].sort((a, b) => {
        const dateA = new Date(a.generatedDate);
        const dateB = new Date(b.generatedDate);
        
        // 1. Sort by Date
        if (sortByDate === 'newest') {
            if (dateA < dateB) return 1;
            if (dateA > dateB) return -1;
        } else if (sortByDate === 'oldest') {
            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;
        }

        // 2. Sort by Name (secondary sort)
        if (sortByName === 'asc') {
            return a.name.localeCompare(b.name);
        } else {
            return b.name.localeCompare(a.name);
        }
    });

    // --- Handlers ---
    const handleStartFlashcards = (flashcard) => {
        console.log(`Starting Flashcards for File ID: ${flashcard.file_id}`);
        // TODO: Implement navigation to the /flashcards/{file_id} route
        alert(`Navigating to Flashcards: ${flashcard.name}`);
    };
    
    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this flashcard set?")) {
            // TODO: Add API call for deletion here
            console.log(`[DELETE] Attempting to delete flashcard document with id: ${id}`);
            setFlashcards(flashcards.filter(flashcard => flashcard.id !== id));
        }
    };
    
    // --- Render Logic ---
    if (isLoading) {
        return <Loader />; 
    }
    
    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-md space-y-3">
                <p className="font-bold">Error loading flashcards</p>
                <p className="text-sm">{error}</p>
                <button
                    onClick={fetchFlashcards}
                    className="inline-flex items-center px-3 py-1 border border-transparent rounded-lg text-sm font-medium text-red-700 bg-red-200 hover:bg-red-300 transition-colors"
                >
                    <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">My Flashcards</h1>

            {/* Search and Sort Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Input */}
                <div className="relative col-span-1 md:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search flashcards..."
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
                        <option value="newest">Sort by Date Generated (Newest)</option>
                        <option value="oldest">Sort by Date Generated (Oldest)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </div>

                {/* Sort by Name Dropdown (Added for complete sorting feature) */}
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

            {/* Flashcards List */}
            <div className="space-y-4">
                {sortedFlashcards.length > 0 ? (
                    sortedFlashcards.map((flashcard) => (
                        <div
                            key={flashcard.file_id}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between
                                        bg-white border border-gray-100 p-4 rounded-lg shadow-sm hover:border-indigo-300 transition-all cursor-pointer relative"
                            onClick={() => handleStartFlashcards(flashcard)}
                        >
                            <div className="flex items-start mb-3 sm:mb-0 min-w-0 pr-12 sm:pr-4 flex-auto">
                                <Zap className="w-5 h-5 text-indigo-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-grow">
                                    <p 
                                        className="text-base font-semibold text-gray-900 truncate" 
                                        title={flashcard.name} 
                                    >
                                        {flashcard.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 space-x-3">
                                        <span className="inline-flex items-center"><Clock className="w-3 h-3 mr-1"/> Generated: **{formatDate(flashcard.generatedDate)}**</span>
                                        <span className="inline-flex items-center"><Zap className="w-3 h-3 mr-1 text-green-500"/> Source: {flashcard.source}</span>
                                    </p>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 flex-shrink-0 mt-3 sm:mt-0 items-center">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleStartFlashcards(flashcard); }}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                                >
                                    Start
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(flashcard.id); }}
                                    className="inline-flex items-center p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                    aria-label={`Delete ${flashcard.name}`}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-600 border border-gray-200 rounded-xl bg-gray-50">
                        No flashcard sets found. Generate one from a lesson to begin learning!
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlashcardsSection;