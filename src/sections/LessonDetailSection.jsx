// src/components/LessonDetailSection.jsx (FINAL REVISED VERSION FOR DEPLOYMENT)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    ArrowLeft, FileText, Plus, RefreshCw, Download, Zap, Trash2, MoreHorizontal,
    ExternalLink, BookOpen, X, Maximize2 
} from 'lucide-react';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext.jsx'; 

// API endpoint from environment variables
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT; 

// --- Constants ---
const REVIEWER_TYPE = 'reviewer';
const FLASHCARDS_TYPE = 'flashcards';

// --- Utilities ---

/**
 * Returns the Google Docs Viewer URL for a given RAW streaming URL.
 * NOTE: This utility should ONLY be passed the deployed FastAPI Streaming URL.
 */
const getViewerUrl = (rawFileUrl) => {
    // The 'embedded=true' flag forces it to use the embedded look.
    return `https://docs.google.com/gview?url=${encodeURIComponent(rawFileUrl)}&embedded=true`;
};

// --- Components ---

// ... (useGeneratingText hook remains the same)
const useGeneratingText = (isGenerating) => {
    const [dots, setDots] = useState('');
    useEffect(() => {
        if (isGenerating) {
            const interval = setInterval(() => {
                setDots(prev => {
                    if (prev.length >= 3) return '';
                    return prev + '.';
                });
            }, 500);
            return () => clearInterval(interval);
        } else {
            setDots('');
        }
    }, [isGenerating]);
    return isGenerating ? `Generating${dots}` : '';
};


// ... (ContentCard component remains the same)
const ContentCard = ({ 
    type, 
    data, 
    isGenerating, 
    onGenerate, 
    onRegenerate, 
    onDelete,
    onDownload 
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const generatingText = useGeneratingText(isGenerating);

    const Icon = type === REVIEWER_TYPE ? BookOpen : Zap;
    const isGenerated = !!data;

    // Menu component specific to this card
    const Menu = ({ data }) => (
        <div 
            className="absolute right-0 top-10 z-20 w-48 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5"
            onClick={(e) => e.stopPropagation()} 
        >
            <div className="py-1">
                <button 
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => { onRegenerate(); setIsMenuOpen(false); }}
                >
                    <RefreshCw className="w-4 h-4 mr-3 text-indigo-500" /> Regenerate
                </button>
                {type === REVIEWER_TYPE && onDownload && (
                    <button 
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => { onDownload(data.file_id); setIsMenuOpen(false); }}
                    >
                        <Download className="w-4 h-4 mr-3 text-green-500" /> Download (.docx)
                    </button>
                )}
                <button 
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => { onDelete(data.document_id, data.name); setIsMenuOpen(false); }}
                >
                    <Trash2 className="w-4 h-4 mr-3" /> Delete
                </button>
            </div>
        </div>
    );
    
    // Render state based on generating status
    const renderContent = () => {
        if (isGenerating) {
            return (
                <div className="flex flex-col items-center justify-center text-center">
                    <BookOpen className={`w-8 h-8 text-indigo-600 animate-pulse`} />
                    <p className="mt-4 text-lg font-semibold text-indigo-600">
                        {generatingText}
                    </p>
                </div>
            );
        }

        if (isGenerated) {
            return (
                <div className="flex flex-col items-center justify-center text-center">
                    <Icon className="w-12 h-12 text-indigo-600" />
                    <p className="mt-3 text-sm font-semibold text-gray-800 truncate w-full px-2" title={data.name}>
                        {data.name}
                    </p>
                    <button className="mt-2 text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors">
                        View {type === REVIEWER_TYPE ? 'Reviewer' : 'Flashcards'} (Soon)
                    </button>
                </div>
            );
        }

        // Not generated state
        return (
            <div className="flex flex-col items-center justify-center text-center">
                <button 
                    onClick={onGenerate}
                    className="flex flex-col items-center justify-center p-4 rounded-full bg-indigo-50 border-2 border-dashed border-indigo-300 hover:bg-indigo-100 transition-colors"
                    aria-label={`Generate ${type}`}
                >
                    <Plus className="w-8 h-8 text-indigo-600" />
                </button>
                <p className="mt-3 text-base font-semibold text-gray-700">
                    Generate {type === REVIEWER_TYPE ? 'Reviewer' : 'Flashcards'}
                </p>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 flex flex-col relative h-full min-h-[300px]">
            <h2 className="text-xl font-bold text-gray-800 capitalize mb-4">
                {type === REVIEWER_TYPE ? 'Generated Reviewer' : 'Generated Flashcards'}
            </h2>

            {/* Menu Button */}
            {isGenerated && !isGenerating && (
                <button 
                    className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors z-30"
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(prev => !prev); }}
                    aria-expanded={isMenuOpen}
                >
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            )}
            {isMenuOpen && <Menu data={data} />}

            {/* Dynamic Content */}
            <div className="flex-grow flex items-center justify-center p-6">
                {renderContent()}
            </div>
        </div>
    );
};


/**
 * Full-Screen Viewer Modal Component
 */
// 🛑 REVISION: Accepts the raw API URL, not the already-wrapped viewer URL
const FullScreenViewer = ({ rawFileApiUrl, fileName, onClose }) => {
    // Wrap the raw API URL with the Google Viewer URL only now
    const finalViewerUrl = getViewerUrl(rawFileApiUrl); 

    return (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-95 flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white truncate max-w-[80%]">{fileName || 'Lesson Viewer'}</h2>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full text-white hover:bg-gray-700 transition-colors"
                    aria-label="Close Full Screen"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
            <div className="flex-grow bg-white rounded-lg overflow-hidden">
                <iframe 
                    // 🛑 REVISION: Use the correctly generated finalViewerUrl
                    src={finalViewerUrl} 
                    className="w-full h-full border-none"
                    title="Lesson File Viewer - Full Screen"
                    sandbox="allow-scripts allow-same-origin" 
                >
                    Your browser does not support iframes.
                </iframe>
            </div>
        </div>
    );
};


/**
 * Main Lesson Detail Section Component
 */
function LessonDetailSection() {
    const { fileId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    
    // 🛑 REVISION: State now stores the RAW API endpoint URL
    const [rawFileApiUrl, setRawFileApiUrl] = useState(null);
    const [associations, setAssociations] = useState([]);
    const [isSourceLoading, setIsSourceLoading] = useState(true);
    const [isAssocLoading, setIsAssocLoading] = useState(true);
    const [isReviewerGenerating, setIsReviewerGenerating] = useState(false);
    const [isFlashcardsGenerating, setIsFlashcardsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false); 
    
    // Filter the associations array into the two specific generated files
    const reviewerData = useMemo(() => associations.find(f => f.type === REVIEWER_TYPE), [associations]);
    const flashcardsData = useMemo(() => associations.find(f => f.type === FLASHCARDS_TYPE), [associations]);

    // 💡 NEW HELPER: Memoized final URL for the main iframe
    const viewerUrl = useMemo(() => {
        return rawFileApiUrl ? getViewerUrl(rawFileApiUrl) : null;
    }, [rawFileApiUrl]);


    // --- 1. Fetch Source File URL (for streaming/viewing) ---
    const fetchSourceFile = useCallback(async () => {
        if (!fileId) {
            setError("Missing file ID in URL.");
            setIsSourceLoading(false);
            return;
        }

        setIsSourceLoading(true);
        try {
            // 🛑 REVISION: The state is set to the raw API URL that will stream the file
            const actualFileUrl = `${API_ENDPOINT}/cloud/file/view?file_id=${fileId}`;
            setRawFileApiUrl(actualFileUrl);
            
        } catch (err) {
            console.error('Source File Fetch Error:', err);
            // Error here would be less common since it's just setting a string, 
            // the real error handling will happen when the iframe tries to load the URL.
            setError('Could not prepare the lesson file viewing URL.');
        } finally {
            setIsSourceLoading(false);
        }
    }, [fileId]);

    // --- 2. Fetch Associated Reviewer/Flashcards ---
    // ... (fetchAssociations remains the same)
    const fetchAssociations = useCallback(async () => {
        if (!isAuthenticated || !user?.$id || !fileId) {
             setIsAssocLoading(false); 
             return;
        }

        setIsAssocLoading(true);
        setError(null);
        try {
            const url = `${API_ENDPOINT}/cloud/file/associate`;
            const response = await axios.get(url, {
                params: { source_file_id: fileId }
            });

            if (response.data.success) {
                setAssociations(response.data.files);
            } else {
                setError('Failed to load associated study materials.');
            }
        } catch (err) {
            console.error('Association Fetch Error:', err);
            const detail = err.response?.data?.detail || 'Could not connect to the server or retrieve data.';
            setError(`Association error: ${detail}`);
        } finally {
            setIsAssocLoading(false);
        }
    }, [fileId, isAuthenticated, user?.$id]);


    useEffect(() => {
        fetchSourceFile();
        fetchAssociations();
    }, [fetchSourceFile, fetchAssociations]);


    // --- Handlers for Generation/Actions (Remain the same) ---
    const handleGenerate = async (type) => {
        if (!isAuthenticated || !user?.$id) return; 

        const isReviewer = type === REVIEWER_TYPE;
        const generationUrl = isReviewer ? `${API_ENDPOINT}/generate/reviewer` : `${API_ENDPOINT}/generate/flashcards`;
        
        isReviewer ? setIsReviewerGenerating(true) : setIsFlashcardsGenerating(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file_id', fileId);
            formData.append('user_id', user.$id);
            
            if (!isReviewer) {
                formData.append('items', 40); 
                formData.append('multiple_choice', true);
                formData.append('identification', true);
                formData.append('true_or_false', true);
                formData.append('enumeration', true);
            }
            
            const response = await axios.post(generationUrl, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                alert(`${type} successfully generated!`);
                await fetchAssociations();
            } else {
                setError(`Failed to generate ${type}.`);
            }
        } catch (err) {
            console.error(`${type} Generation Error:`, err);
            setError(`Error during ${type} generation: ${err.message}`);
        } finally {
            isReviewer ? setIsReviewerGenerating(false) : setIsFlashcardsGenerating(false);
        }
    };
    
    const handleDownloadReviewer = async (reviewerFileId) => {
        setError(null);
        try {
            const url = `${API_ENDPOINT}/download/reviewer/docx`;
            const formData = new FormData();
            formData.append('reviewer_file_id', reviewerFileId);
            
            const response = await axios.post(url, formData, {
                responseType: 'blob', 
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `${reviewerData.name || 'reviewer'}.docx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
            
        } catch (err) {
            console.error('Download Error:', err);
            setError('Failed to download the reviewer file.');
        }
    };

    const handleDeleteAssociation = (documentId, name) => {
        if (window.confirm(`Are you sure you want to delete the generated file: ${name}?`)) {
            // TODO: Implement actual deletion API call here
            console.log(`[DELETE] Deleting document ID: ${documentId}`);
            setAssociations(prev => prev.filter(a => a.document_id !== documentId));
            alert(`${name} deleted (locally for now).`);
        }
    };


    // --- Render Logic ---

    // 1. Full-Page Loader Check
    if (isSourceLoading || isAssocLoading) {
        return <Loader />; 
    }
    
    // 2. Full-Screen Viewer Modal
    // 🛑 REVISION: Pass the rawFileApiUrl to the modal
    if (isViewerOpen && rawFileApiUrl) {
        const lessonFileName = 'Lesson File'; // Placeholder
        return <FullScreenViewer rawFileApiUrl={rawFileApiUrl} fileName={lessonFileName} onClose={() => setIsViewerOpen(false)} />;
    }

    // 3. Error State Check
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-10 space-y-4">
                <p className="text-xl font-bold text-red-700">Error Loading Details</p>
                <p className="text-sm text-red-500">{error}</p>
                <button
                    onClick={() => { fetchSourceFile(); fetchAssociations(); setError(null); }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                    <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                </button>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Back Button */}
                        <button 
                            onClick={() => navigate(-1)} 
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                            aria-label="Go Back"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        
                        {/* Logo and Name (Center) */}
                        <div className="flex-grow flex justify-center">
                            <div className="flex items-center space-x-2">
                                <div className="text-xl font-bold text-indigo-600">QuickRev</div>
                            </div>
                        </div>

                        {/* Right Placeholder */}
                        <div className="w-10"></div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-6 truncate">
                    Lesson: File ID: {fileId} 
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"> 
                    
                    {/* CARD 1: Live Lesson Viewer (Takes 2/3 of the space) */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-indigo-100 flex flex-col overflow-hidden h-[80vh] min-h-[600px]">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-indigo-50/50">
                            <h2 className="text-xl font-bold text-indigo-700 flex items-center">
                                <FileText className="w-5 h-5 mr-2" /> Lesson File Viewer
                            </h2>
                            <button
                                onClick={() => setIsViewerOpen(true)}
                                className="inline-flex items-center px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
                            >
                                Full Screen <Maximize2 className="w-4 h-4 ml-1.5" />
                            </button>
                        </div>

                        {/* The actual iframe to stream the document (using Google Viewer) */}
                        <div className="flex-grow overflow-auto p-2">
                            {viewerUrl ? (
                                <iframe 
                                    // 🛑 REVISION: Using the correctly generated viewerUrl
                                    src={viewerUrl} 
                                    className="w-full h-full border-none min-h-[600px]"
                                    title="Lesson File Viewer"
                                    sandbox="allow-scripts allow-same-origin" 
                                >
                                    Your browser does not support iframes.
                                </iframe>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <p>Preparing file viewer URL. Please wait...</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* CARD 2 & 3: Reviewer & Flashcards (Takes 1/3 of the space) */}
                    <div className="lg:col-span-1 space-y-8">
                        
                        {/* Reviewer Card */}
                        <ContentCard
                            type={REVIEWER_TYPE}
                            data={reviewerData}
                            isGenerating={isReviewerGenerating}
                            onGenerate={() => handleGenerate(REVIEWER_TYPE)}
                            onRegenerate={() => handleGenerate(REVIEWER_TYPE)} 
                            onDelete={(docId, name) => handleDeleteAssociation(docId, name)}
                            onDownload={handleDownloadReviewer}
                        />

                        {/* Flashcards Card */}
                        <ContentCard
                            type={FLASHCARDS_TYPE}
                            data={flashcardsData}
                            isGenerating={isFlashcardsGenerating}
                            onGenerate={() => handleGenerate(FLASHCARDS_TYPE)}
                            onRegenerate={() => handleGenerate(FLASHCARDS_TYPE)}
                            onDelete={(docId, name) => handleDeleteAssociation(docId, name)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LessonDetailSection;