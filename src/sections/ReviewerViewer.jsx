// src/sections/ReviewerViewer.jsx (REVISED: Local Editing, Save-to-Backend, Download-from-Local/Backend)

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import SimpleMdeReact from 'react-simplemde-editor'; 
import 'easymde/dist/easymde.min.css'; // Import editor styles
import ReactMarkdown from 'react-markdown'; 
import remarkGfm from 'remark-gfm'; 

// Import new icons for the download button
import { Save, ArrowLeft, RefreshCw, Eye, Edit2, FileText } from 'lucide-react'; 
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

// --- Custom Tailwind Styling for Rendered Markdown (REDUCED HEADER SIZE) ---
const MarkdownComponents = {
    // ... (MarkdownComponents remains the same) ...
    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-4 mb-2 border-b pb-1 text-indigo-700 sm:text-3xl" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mt-3 mb-2 text-gray-800 sm:text-2xl" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-2 mb-1 text-gray-700 sm:text-xl" {...props} />,
    p: ({ node, ...props }) => <p className="mb-3 leading-relaxed text-base" {...props} />,
    ul: ({ node, ...props }) => <ul className="list-disc list-inside ml-4 mb-3 space-y-1" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal list-inside ml-4 mb-3 space-y-1" {...props} />,
    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
    strong: ({ node, ...props }) => <strong className="font-extrabold text-indigo-700" {...props} />,
    hr: ({ node, ...props }) => <hr className="my-6 border-gray-300" {...props} />,
    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-500 pl-4 py-2 italic text-gray-600 my-3 text-sm" {...props} />,
    table: ({ node, ...props }) => <table className="table-auto w-full my-3 border-collapse border border-gray-400 text-sm" {...props} />,
    th: ({ node, ...props }) => <th className="bg-gray-100 border border-gray-300 px-3 py-1 text-left font-medium" {...props} />,
    td: ({ node, ...props }) => <td className="border border-gray-300 px-3 py-1" {...props} />,
};

function ReviewerViewer() {
    const { reviewerFileId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    // State for content management
    const [content, setContent] = useState(''); // Current content (local edits)
    const [initialContent, setInitialContent] = useState(''); // Content from last successful load/save

    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(true); 

    // Check if the current content is different from the last saved/loaded content
    const isDirty = content !== initialContent;

    // --- Ref and Scroll Fix (Kept for functionality) ---
    const easyMdeInstanceRef = useRef(null);

    const onInstanceInit = useCallback((instance) => {
        easyMdeInstanceRef.current = instance;
    }, []);

    useEffect(() => {
        if (easyMdeInstanceRef.current && isEditing) {
            const editor = easyMdeInstanceRef.current;
            const codeMirrorWrapper = editor.codemirror.getWrapperElement();
            const preview = editor.element.nextElementSibling; 

            if (codeMirrorWrapper) {
                // Apply Tailwind-like styles directly to CodeMirror wrapper
                codeMirrorWrapper.style.height = '100%';
                codeMirrorWrapper.style.minHeight = '100%';
                codeMirrorWrapper.style.overflowY = 'auto';
                codeMirrorWrapper.style.display = 'flex'; 
                codeMirrorWrapper.style.flexDirection = 'column'; 
            }

            if (preview && preview.classList.contains('editor-preview')) {
                preview.style.height = '100%';
                preview.style.minHeight = '100%';
                preview.style.overflowY = 'auto';
            }
            
            editor.codemirror.refresh();
        }
    }, [isEditing, content]);


    // --- Data Fetching ---
    const fetchFileContent = useCallback(async () => {
        if (!isAuthenticated || !reviewerFileId) return;

        setIsLoading(true);
        setError(null);
        try {
            const url = `${API_ENDPOINT}/cloud/file/view?file_id=${reviewerFileId}`;
            const response = await axios.get(url, { responseType: 'text' });
            setContent(response.data);
            setInitialContent(response.data); // Set initial content to track changes
        } catch (err) {
            console.error("Error fetching reviewer content:", err);
            setError(`Failed to load reviewer content. Detail: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, reviewerFileId]);

    useEffect(() => {
        fetchFileContent();
    }, [fetchFileContent]);

    // --- Save Markdown Changes Handler (Saves to backend) ---
    const handleSaveChanges = async () => {
        if (!isAuthenticated || !reviewerFileId || !isDirty) return;

        setIsProcessing(true);
        setError(null);
        try {
            const url = `${API_ENDPOINT}/cloud/file/update`;
            
            const response = await axios.put(url, {
                file_id: reviewerFileId,
                content: content, // Send current content
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data.success) {
                alert("Reviewer updated successfully!");
                setInitialContent(content); // Update initial content to reflect the saved state
                setIsEditing(false); // Switch to View mode after save
            } else {
                setError(`Failed to save changes: ${response.data.message || 'Unknown error'}`);
            }

        } catch (err) {
            console.error("Error saving reviewer content:", err);
            setError(`Error saving changes: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };
    
    // --- Download DOCX Handler (Sends current content to backend for conversion) ---
    const handleDownloadDocx = async () => {
        if (!isAuthenticated) return; // Note: reviewerFileId is not strictly needed if we pass content

        setIsProcessing(true);
        setError(null);

        try {
            const url = `${API_ENDPOINT}/download/reviewer/docx`;
            
            // Data to send: the actual content and the file ID (for name lookup)
            const requestData = {
                reviewer_file_id: reviewerFileId,
                content: content, // Pass the current, potentially unsaved, content
            };

            // 2. Perform POST request with JSON body
            const response = await axios.post(url, requestData, {
                responseType: 'blob',
                headers: { 'Content-Type': 'application/json' },
            });

            // 3. Handle file download
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const downloadUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = downloadUrl;

            // Try to get filename from headers, fallback to a default
            const contentDisposition = response.headers['content-disposition'];
            let filename = `${reviewerFileId}_reviewer.docx`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch.length === 2) {
                    filename = filenameMatch[1];
                }
            }
            link.setAttribute('download', filename); 
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            window.URL.revokeObjectURL(downloadUrl);
            
        } catch (err) {
            console.error("Error downloading DOCX:", err);
            
            if (err.response && err.response.data instanceof Blob) {
                const text = await err.response.data.text();
                try {
                    const errorJson = JSON.parse(text);
                    setError(`Failed to download: ${errorJson.detail.message || 'Server error'}`);
                } catch {
                    setError(`Failed to download DOCX. Server returned status: ${err.response.status}`);
                }
            } else {
                setError(`Network error during download: ${err.message}`);
            }

        } finally {
            setIsProcessing(false);
        }
    };


    const mdeOptions = useMemo(() => {
        return {
            // ... (mdeOptions remain the same) ...
            spellChecker: false,
            sideBySideFullscreen: false, 
            hideIcons: ["guide", "fullscreen"],
            autofocus: true,
            minHeight: '100%', 
            maxHeight: '100%',
        };
    }, []);

    if (isLoading) {
        return <Loader message="Loading Reviewer File..." />;
    }

    if (error && !content) {
        // ... (Error JSX remains the same) ...
        return (
            <div className="flex flex-col items-center justify-center p-4 min-h-screen">
                <p className="text-xl font-bold text-red-700">Error Loading Reviewer</p>
                <p className="text-sm text-red-500">{error}</p>
                <button
                    onClick={fetchFileContent}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                    <RefreshCw className="w-4 h-4 mr-2" /> Try Reloading
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 text-indigo-600 hover:text-indigo-800"
                >
                    Go back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* --- Mobile-Friendly Navbar --- */}
            <nav className="bg-white shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        
                        {/* Back Button and Title */}
                        <div className='flex items-center'>
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                                aria-label="Go Back"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="hidden sm:block text-base font-bold text-gray-900 truncate ml-2">
                                Reviewer: {reviewerFileId}
                            </h1>
                        </div>

                        {/* Action Buttons (Condensed for mobile) */}
                        <div className="flex space-x-1 sm:space-x-2">
                            {/* View/Edit Toggle */}
                            <button
                                onClick={() => setIsEditing(prev => !prev)}
                                className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 border rounded-lg text-xs sm:text-sm font-medium transition-colors bg-white hover:bg-gray-100 border-gray-300 text-gray-700"
                                aria-label={isEditing ? "Switch to View Mode" : "Switch to Edit Mode"}
                            >
                                {isEditing ? (
                                    <><Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" /> <span className="hidden sm:inline">View</span></>
                                ) : (
                                    <><Edit2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" /> <span className="hidden sm:inline">Edit</span></>
                                )}
                                <span className="inline sm:hidden">{isEditing ? 'View' : 'Edit'}</span>
                            </button>
                            
                            {/* Save Button (Visible when editing AND content is dirty) */}
                            {isEditing && isDirty && (
                                <button
                                    onClick={handleSaveChanges}
                                    disabled={isProcessing}
                                    className={`inline-flex items-center px-2 py-1 sm:px-4 sm:py-2 border border-transparent rounded-lg text-xs sm:text-sm font-medium text-white transition-colors ${
                                        isProcessing
                                            ? 'bg-indigo-400 cursor-not-allowed'
                                            : 'bg-indigo-600 hover:bg-indigo-700' 
                                    }`}
                                >
                                    <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
                                    {isProcessing ? 'Updating...' : 'Save'}
                                </button>
                            )}
                            
                            {/* Download DOCX Button (Always visible in View mode) */}
                            {!isEditing && (
                                <button
                                    onClick={handleDownloadDocx}
                                    disabled={isProcessing}
                                    className={`inline-flex items-center px-2 py-1 sm:px-4 sm:py-2 border border-transparent rounded-lg text-xs sm:text-sm font-medium text-white transition-colors ${
                                        isProcessing
                                            ? 'bg-green-400 cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-700' 
                                    }`}
                                >
                                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
                                    {isProcessing ? 'Preparing...' : 'Download DOCX'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- Main Content Area --- */}
            <div className="flex-grow w-full px-2 sm:px-4 lg:px-8 pt-4 pb-8 lg:max-w-7xl lg:mx-auto">
                
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded-lg" role="alert">
                        <p className="font-bold text-sm">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* The Combined Viewer/Editor Card */}
                <div className="bg-white p-2 sm:p-4 rounded-xl shadow-lg border border-gray-100 h-full lg:h-[80vh] flex flex-col">
                    
                    {isEditing && (
                        /* The editor wrapper is flex-grow, h-full to occupy the remaining space */
                        <div className="flex-grow flex flex-col h-full"> 
                            <SimpleMdeReact 
                                value={content} 
                                onChange={setContent}
                                options={mdeOptions}
                                getMdeInstance={onInstanceInit} // Use the custom instance init handler
                            />
                        </div>
                    )}
                    
                    {/* Rendered View */}
                    {!isEditing && (
                        /* Flex-grow and explicit scroll for the viewer */
                        <div className="flex-grow overflow-y-auto prose max-w-none p-2 sm:p-4 text-gray-800">
                            <ReactMarkdown 
                                components={MarkdownComponents}
                                remarkPlugins={[remarkGfm]}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ReviewerViewer;