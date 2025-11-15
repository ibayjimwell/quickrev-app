// src/components/ReviewerSection.jsx (NEW IMPLEMENTATION for Reviewer Listing)

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
// ADDED Trash2 import
import { Search, ChevronDown, FileText, Eye, RefreshCw, Loader2, Trash2 } from 'lucide-react'; 
import Loader from '../components/Loader'; // Assuming this import path is correct
import { useAuth } from '../context/AuthContext.jsx'; // Assuming this context is available
import { useNavigate } from 'react-router-dom';

// API endpoint from environment variables
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT; 
const REVIEWER_FILE_TYPE = "reviewer"; // Define the specific type for this section

function ReviewerSection() {
    const { user, isAuthenticated } = useAuth();
    
    const [reviewers, setReviewers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortByDate, setSortByDate] = useState('newest'); // 'newest' | 'oldest'
    const [sortByName, setSortByName] = useState('asc');    // 'asc' | 'desc'
    const navigate = useNavigate();
    
    // --- Data Fetching Logic ---
    const fetchReviewers = useCallback(async () => {
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
                    type: REVIEWER_FILE_TYPE // Requesting only "reviewer" files
                }
            });

            if (response.data.success) {
                const fetchedReviewers = response.data.files.map(file => ({
                    id: file.document_id, 
                    file_id: file.file_id, 
                    name: file.name,
                    uploadedDate: file.updated_at, 
                }));
                setReviewers(fetchedReviewers);
            } else {
                setError('Failed to load reviewers from server.');
            }
        } catch (err) {
            console.error('Reviewer Fetch Error:', err);
            setError(err.response?.data?.detail || 'Could not connect to the server or retrieve data.');
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user?.$id]);

    useEffect(() => {
        fetchReviewers();
    }, [fetchReviewers]);


    // --- Filtering and Sorting Logic ---
    const filteredReviewers = reviewers.filter(reviewer =>
        reviewer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedReviewers = [...filteredReviewers].sort((a, b) => {
        const dateA = new Date(a.uploadedDate);
        const dateB = new Date(b.uploadedDate);
        
        // 1. Sort by Date
        if (sortByDate === 'newest') {
            if (dateA < dateB) return 1;
            if (dateA > dateB) return -1;
        } else if (sortByDate === 'oldest') {
            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;
        }

        // 2. Sort by Name (as secondary sort if dates are equal)
        if (sortByName === 'asc') {
            return a.name.localeCompare(b.name);
        } else {
            return b.name.localeCompare(a.name);
        }
    });

    // --- Handlers & Helpers ---
    const handleOpenReviewer = (reviewer) => {
        navigate(`/main/reviewer/${reviewer.file_id}`); // 🔥 NEW NAVIGATION
    };
    
    // ADDED DELETE HANDLER
    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this reviewer file?")) {
            // TODO: Add API call for deletion here
            console.log(`[DELETE] Attempting to delete reviewer document with id: ${id}`);
            // Optimistically remove the reviewer from the state
            setReviewers(reviewers.filter(reviewer => reviewer.id !== id));
        }
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
        return <Loader />; // Use the imported Loader component
    }
    
    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-md space-y-3">
                <p className="font-bold">Error loading reviewers</p>
                <p className="text-sm">{error}</p>
                <button
                    onClick={fetchReviewers}
                    className="inline-flex items-center px-3 py-1 border border-transparent rounded-lg text-sm font-medium text-red-700 bg-red-200 hover:bg-red-300 transition-colors"
                >
                    <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">My Reviewers</h1>

            {/* Search and Sort Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Input */}
                <div className="relative col-span-1 md:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search reviewers..."
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

            {/* Reviewers List */}
            <div className="space-y-4">
                {sortedReviewers.length > 0 ? (
                sortedReviewers.map((reviewer) => (
                    <div
                        key={reviewer.file_id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between
                                    bg-white border border-gray-100 p-4 rounded-lg shadow-sm hover:border-indigo-300 transition-all cursor-pointer relative"
                        onClick={() => handleOpenReviewer(reviewer)}
                    >
                        
                        {/* Reviewer Info (Ensuring Truncation) */}
                        <div className="flex items-start mb-3 sm:mb-0 min-w-0 pr-12 sm:pr-4 flex-auto">
                            <FileText className="w-5 h-5 text-indigo-500 mr-3 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-grow">
                                {/* 'truncate' class applies ellipsis and 'title' attribute provides tooltip */}
                                <p 
                                    className="text-base font-semibold text-gray-900 truncate" 
                                    title={reviewer.name} 
                                >
                                    {reviewer.name}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Generated: **{formatDate(reviewer.uploadedDate)}**
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons (Updated to include Delete) */}
                        <div className="flex flex-wrap gap-2 flex-shrink-0 mt-3 sm:mt-0 items-center">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenReviewer(reviewer); }}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-lg text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
                            >
                                <Eye className="w-4 h-4 mr-2" />Open Reviewer
                            </button>
                            {/* ADDED DELETE BUTTON */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(reviewer.id); }}
                                className="inline-flex items-center p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                aria-label={`Delete ${reviewer.name}`}
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))
                ) : (
                <div className="text-center py-10 text-gray-600 border border-gray-200 rounded-xl bg-gray-50">
                    No reviewers found. Generate one from a lesson to get started!
                </div>
                )}
            </div>

        </div>
    );
}

export default ReviewerSection;