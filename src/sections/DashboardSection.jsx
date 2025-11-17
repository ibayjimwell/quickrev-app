// src/pages/DashboardSection.jsx (FIXED)

import React from 'react';
import axios from 'axios';
import { 
    FileText, 
    UploadCloud, 
    CheckCircle, 
    XCircle, 
    Clock,      
    User,       
    Activity,
    BookOpen,
    ArrowUpCircleIcon      
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx'; 

function DashboardSection() {
    const { user, isAuthenticated } = useAuth(); 
    
    // API endpoint from environment variables
    const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT; 
    
    // --- Constants ---
    const ACCEPTED_FILE_TYPES = 'application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown';
    const SUPPORTED_EXTENSIONS = ['.pdf', '.pptx', '.docx', '.txt', '.md'];
    const FileIcon = ({ className = 'w-5 h-5' }) => <FileText className={className} />;

    const [files, setFiles] = React.useState([]);
    const [isDragging, setIsDragging] = React.useState(false);

    // Function to remove the file from state after the CSS fade-out transition is complete
    const REMOVAL_DELAY_MS = 1000; // Matches duration-1000 in the JSX
    const removeFileFromState = (fileId) => {
        setTimeout(() => {
            setFiles(prev => prev.filter(f => f.id !== fileId));
        }, REMOVAL_DELAY_MS);
    };

    // --- Core Logic: Upload function (FIX APPLIED HERE) ---
    const uploadFile = async (fileObject) => {
        
        const userId = user?.$id;
        if (!isAuthenticated || !userId) {
            alert('Authentication failed: User ID not found. Please log in.');
            setFiles(prev => prev.filter(f => f.id !== fileObject.id));
            return;
        }
        
        // 1. Set status to 'uploading'
        setFiles(prev => prev.map(f => f.id === fileObject.id ? { ...f, status: 'uploading' } : f));

        let errorMessage = 'Upload failed.';

        try {
            const formData = new FormData();
            formData.append('file', fileObject.file);
            formData.append('user_id', userId); 

            const response = await axios.post(`${API_ENDPOINT}/cloud/file/upload`, formData);
            
            if (response.data.success) {
                // 2a. SUCCESS: Update status to 'uploaded'
                setFiles(prev => prev.map(f => 
                    f.id === fileObject.id ? { 
                        ...f, 
                        status: 'uploaded', // This triggers opacity-0 and the fade-out
                        file_id: response.data.file_id 
                    } : f
                ));
                
                // 3a. REMOVAL: Schedule removal after the fade-out is complete (1000ms)
                removeFileFromState(fileObject.id);
                return; 
            } else {
                errorMessage = response.data.message || "Upload failed on the server.";
                throw new Error(errorMessage);
            }

        } catch (error) {
            console.error('Upload Failed for:', fileObject.name, error);
            
            errorMessage = error.response?.data?.detail || error.message || 'Network Error';
            
            // 2b. FAILURE: Update status to 'failed'
            setFiles(prev => prev.map(f => 
                f.id === fileObject.id ? { 
                    ...f, 
                    status: 'failed', // This triggers opacity-0 and the fade-out
                    errorMessage: errorMessage 
                } : f
            ));
            
            // 3b. REMOVAL: Schedule removal after the fade-out is complete (1000ms)
            removeFileFromState(fileObject.id);

        } 
        // NOTE: The 'finally' block is no longer needed for cleanup logic.
    };
    
    // --- Handlers (unchanged) ---
    const handleFiles = (newFiles) => {
        const fileList = Array.from(newFiles);
        
        const validFiles = fileList.filter(file => 
            SUPPORTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))
        );

        if (validFiles.length === 0) return; 

        const fileObjects = validFiles.map(file => ({
            file,
            id: Date.now() + Math.random(),
            name: file.name,
            status: 'pending', 
            file_id: null,
            errorMessage: null,
        }));
        
        setFiles(prevFiles => [...prevFiles, ...fileObjects]);
        
        fileObjects.forEach(f => uploadFile(f));
    };
    
    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleFileInputChange = (e) => {
        if (e.target.files) {
            handleFiles(e.target.files);
            e.target.value = null; 
        }
    };

    // --- Component JSX (Final Revised Layout) ---
    return (
        <div className="flex flex-col space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name || user?.email}!</p>

            {/* Main Layout: Three distinct sections, using two columns on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* === COLUMN 1 (Left Side - Takes 2/3 width) === */}
                <div className="md:col-span-2 space-y-6">
                    
                    {/* 1. CARD: File Uploader (Unchanged) */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <div className="mb-4 pb-3 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-indigo-800">
                                <ArrowUpCircleIcon className='w-5 h-5 inline-block text-indigo-600' />  Upload New Lesson File
                            </h2>
                        </div>
                        
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                            isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
                            }`}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-indigo-600' : 'text-gray-500'}`} />
                            <p className="text-gray-700 mb-2 font-medium">Drag & drop your file here</p>
                            <p className="mt-1 mb-6 text-xs text-gray-500">
                                Maximum size: 10MB. Supports: **PDF, PPTX, DOCX, TXT, MD**
                            </p>
                            
                            <input
                                type="file"
                                multiple
                                accept={ACCEPTED_FILE_TYPES}
                                onChange={handleFileInputChange}
                                id="file-upload"
                                className="hidden"
                            />
                            <label
                                htmlFor="file-upload"
                                className="inline-flex justify-center py-2.5 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition-colors"
                            >
                                Select File
                            </label>
                        </div>
                    </div>

                    {/* 2. CARD: Live Uploads Status */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                           <div className="mb-4 pb-3 border-b border-gray-200">
                             <h3 className="text-xl font-bold text-indigo-800">
                                 <Clock className="w-5 h-5 inline-block text-indigo-600" /> Uploads
                             </h3>
                           </div>
                           
                           <div className="space-y-3">
                             {files.length > 0 ? (
                                 // Show file list if files exist
                                 files.map(file => (
                                     <div
                                         key={file.id}
                                         // The file still fades out visually after success/failure
                                         className={`flex items-start justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 transition-opacity duration-1000 ${
                                             file.status === 'uploaded' || file.status === 'failed' ? 'opacity-0' : 'opacity-100'
                                         }`}
                                     >
                                         <div className="flex items-start min-w-0 pr-4">
                                             <FileIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                             <span className="text-sm font-medium text-gray-800 truncate block ml-3" title={file.name}>
                                                 {file.name}
                                             </span>
                                         </div>
                                         
                                         <div className="flex items-center space-x-3 flex-shrink-0">
                                             {/* Status Indicator (unchanged) */}
                                             {file.status === 'pending' || file.status === 'uploading' ? (
                                                 <div className="flex items-center text-sm text-indigo-600">
                                                     <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                     </svg>
                                                     {file.status === 'pending' ? 'Pending...' : 'Uploading...'}
                                                 </div>
                                             ) : file.status === 'uploaded' ? (
                                                 <div className="flex items-center text-sm text-green-600 font-medium">
                                                     <CheckCircle className="w-4 h-4 mr-1" /> Uploaded
                                                 </div>
                                             ) : file.status === 'failed' ? (
                                                 <div className="flex items-center text-sm text-red-600 font-medium" title={file.errorMessage}>
                                                     <XCircle className="w-4 h-4 mr-1" /> Failed
                                                 </div>
                                             ) : null}
                                         </div>
                                     </div>
                                 ))
                             ) : (
                                 // Show message when file list is empty
                                 <div className="p-4 text-center bg-gray-50 rounded-lg border border-gray-200">
                                     <p className="text-gray-500 font-medium">
                                         Upload files to the file uploader above to see their status here.
                                     </p>
                                 </div>
                             )}
                           </div>
                    </div>
                </div>

                {/* === COLUMN 2 (Right Side - Takes 1/3 width) === */}
                <div className="md:col-span-1 space-y-6">
                    
                    {/* 3. CARD: Account Details (Unchanged) */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                            <div className="flex items-center space-x-2">
                                <User className="w-6 h-6 text-indigo-600" />
                                <h2 className="text-xl font-bold text-indigo-800">Account Details</h2>
                            </div>
                            <span className="text-xs font-medium text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">Active</span>
                        </div>
                        
                        <dl className="space-y-4 text-sm mb-6">
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <dt className="text-gray-500 font-medium">Name</dt>
                                <dd className="text-gray-900 font-bold truncate">{user?.name || 'User Name Not Set'}</dd>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <dt className="text-gray-500 font-medium">Email</dt>
                                <dd className="text-gray-900 truncate">{user?.email || 'N/A'}</dd>
                            </div>
                        </dl>
                        
                        <div className="border-t border-gray-200 pt-3">
                            <h3 className="text-md font-semibold text-gray-700 mb-3">Activity</h3>
                            <div className="grid grid-cols-2 gap-3">
                                
                                <div className="p-4 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200">
                                    <Activity className="w-5 h-5 text-indigo-600 mb-1" />
                                    <dt className="text-xs text-indigo-700 font-medium">Total Files</dt>
                                    <dd className="text-2xl font-extrabold text-indigo-800 mt-1">5</dd> 
                                </div>

                                <div className="p-4 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200">
                                    <Activity className="w-5 h-5 text-indigo-600 mb-1" />
                                    <dt className="text-xs text-indigo-700 font-medium">Total Lessons</dt>
                                    <dd className="text-2xl font-extrabold text-indigo-800 mt-1">5</dd> 
                                </div>

                                <div className="p-4 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200">
                                    <Activity className="w-5 h-5 text-indigo-600 mb-1" />
                                    <dt className="text-xs text-indigo-700 font-medium">Total Reviewers</dt>
                                    <dd className="text-2xl font-extrabold text-indigo-800 mt-1">5</dd> 
                                </div>

                                <div className="p-4 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200">
                                    <Activity className="w-5 h-5 text-indigo-600 mb-1" />
                                    <dt className="text-xs text-indigo-700 font-medium">Total Flashcards</dt>
                                    <dd className="text-2xl font-extrabold text-indigo-800 mt-1">5</dd> 
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardSection;