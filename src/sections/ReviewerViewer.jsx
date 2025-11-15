import React, { useState, useEffect, useCallback } from 'react';
import { Download, ChevronLeft, BookOpen, Maximize, Minimize } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom'; 
import axios from 'axios'; 
import { ArrowLeft } from 'lucide-react';

// Recommended Production Libraries for Markdown:
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; 

// --- Main Component ---

const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT; 

const ReviewerViewer = () => {
  // --- React Router Hooks ---
  const { fileId } = useParams();
  const navigate = useNavigate();
  
  // --- State ---
  const [markdownContent, setMarkdownContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false); 

  // Toggle Fullscreen handler
  const toggleFullScreen = useCallback(() => {
    setIsFullScreen(prev => !prev);
  }, []);

  // 1. Fetch Markdown Content (Axios Implementation)
  useEffect(() => {
    if (!fileId) {
      setError('File ID not found in the route.');
      setIsLoading(false);
      return;
    }

    const fetchMarkdown = async () => {
      const controller = new AbortController(); 
      
      try {
        const url = `${API_BASE_URL}/cloud/file/view`;
        
        const response = await axios.get(url, {
          params: { file_id: fileId },
          responseType: 'text',
          signal: controller.signal, 
        });

        setMarkdownContent(response.data); 
      } catch (e) {
        if (axios.isCancel(e)) {
            return;
        }
        console.error('Failed to fetch reviewer file:', e.response?.data || e.message);
        const errorMessage = e.response?.status 
          ? `Server error: Status ${e.response.status}`
          : e.message;
          
        setError(`Could not load the reviewer content: ${errorMessage}`);
        setMarkdownContent(`# Error Loading Content\n\nDetails: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkdown();
    
    // Cleanup function 
    return () => {
        // controller.abort();
    };
  }, [fileId]);

  // 2. Handle DOCX Download (Axios Implementation)
  const handleDownload = useCallback(async () => {
    if (!fileId) {
      console.error("Cannot download: File ID is missing.");
      return;
    }

    try {
      const url = `${API_BASE_URL}/download/reviewer/docx`;

      const formData = new FormData();
      formData.append("reviewer_file_id", fileId);

      const response = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob",
      });

      // Handle file download
      const disposition = response.headers["content-disposition"];
      let filename = `(Reviewer) ${fileId.substring(0, 8)}.docx`;

      if (disposition && disposition.indexOf("filename=") !== -1) {
        const filenameMatch = disposition.match(
          /filename\*?=['"]?([^'"]*)['"]?$/i
        );
        filename = filenameMatch ? filenameMatch[1] : filename;
      }

      const blob = response.data;
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      console.error(
        "Error during DOCX download:",
        e.response?.data || e.message
      );
      alert("Download failed. Please check console for details.");
    }
  }, [fileId]);

  // 3. Handle Back Navigation (Dynamic)
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // --- Render ---
  return (
    // Outer container: Full screen, fixed height, hides horizontal overflow. 
    // Background changes to near black for better focus in fullscreen.
    <div className={`flex flex-col h-screen w-screen text-gray-800 font-sans overflow-x-hidden ${isFullScreen ? 'bg-gray-900' : 'bg-gray-100'}`}>
      
      {/* Top Navbar: HIDDEN in fullscreen mode */}
      {!isFullScreen && (
        <nav className="flex-shrink-0 bg-white border-b border-gray-200 shadow-md sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            
            {/* Left: Back Button */}
            <button 
               onClick={() => navigate(-1)} 
               className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
               aria-label="Go Back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            {/* Center: Title/Logo */}
            <div className="flex items-center space-x-2">
              <img className='w-10 h-10' src="/icon.png" alt="QuickRev Icon" />
              <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                Quick<span className="text-indigo-600">Rev</span>
              </span>
            </div>

            {/* Right Group: Download */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                disabled={isLoading || error || !markdownContent}
                className="flex items-center bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Download reviewer as DOCX"
              >
                <Download className="w-5 h-5 mr-1" />
                <span className="hidden sm:inline">Download</span>
              </button>
              {/* Fullscreen button is now outside the navbar */}
            </div>
          </div>
        </nav>
      )}
      
      {/* 💡 FIXED BOTTOM RIGHT FULLSCREEN TOGGLE */}
      <button
        onClick={toggleFullScreen}
        // Use fixed positioning, z-index high, position bottom-4 right-4, apply conditional styles
        className={`fixed z-50 p-3 rounded-full shadow-xl transition-all duration-300
          ${isFullScreen 
            ? 'bottom-4 right-4 bg-white text-gray-800 hover:bg-gray-200' // Subtle exit button
            : 'bottom-4 right-4 bg-indigo-600 text-white hover:bg-indigo-700' // Prominent enter button
          }
        `}
        aria-label={isFullScreen ? "Exit fullscreen mode" : "Enter fullscreen mode"}
      >
        {isFullScreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
      </button>

      {/* Main Content Area: Fills vertical space and handles scrolling. */}
      <main className={`flex-grow w-full overflow-y-auto flex justify-center 
          ${isFullScreen 
            ? 'p-0 sm:p-0 md:p-0' // No padding in fullscreen
            : 'pt-2 sm:pt-4 md:pt-8 pb-24' // Standard padding
          }
      `}>
        {/* Bond-Paper Container: Width changes in fullscreen */}
        <div className={`bg-white shadow-2xl rounded-lg h-fit 
            ${isFullScreen 
              ? 'w-full max-w-none md:max-w-4xl lg:max-w-6xl' // Wider in fullscreen
              : 'w-full max-w-3xl' // Standard width
            }
        `}>
          
          {isLoading && (
            <div className="text-center py-20 text-indigo-600 min-h-[50vh]">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <p className="mt-4 text-lg font-medium">Loading Reviewer...</p>
            </div>
          )}
          
          {!isLoading && markdownContent && (
            // Markdown Wrapper: Padding changes in fullscreen
            <div className={`min-h-full 
                ${isFullScreen
                    ? 'p-8 sm:p-16 md:p-24' // Larger padding in fullscreen
                    : 'p-8 sm:p-12 md:p-16' // Standard padding
                }
            `}>
              <div className="markdown-content text-gray-800 transition-all duration-300">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {markdownContent}
                </ReactMarkdown>
              </div>
            </div>
          )}
          
          {!isLoading && !markdownContent && error && (
            <div className="p-12 text-center text-red-600">
              <h2 className="text-xl font-bold">Error</h2>
              <p>{error}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReviewerViewer;

// --- Custom Components for ReactMarkdown (Styles for the "Bond Paper") ---
const markdownComponents = {
    // Styling the container for readability (Calm Viewing)
    p: ({ children }) => <p style={{ marginBottom: '1.5rem', lineHeight: '1.75', fontSize: '1.1rem' }}>{children}</p>,
    
    // Headings
    h1: ({ children }) => <h1 className="text-3xl font-extrabold text-indigo-700 mt-8 mb-4 border-b pb-2">{children}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-bold text-indigo-600 mt-6 mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-semibold text-indigo-500 mt-4 mb-2">{children}</h3>,
    
    // Lists
    ul: ({ children }) => <ul style={{ paddingLeft: '2rem', listStyle: 'disc', marginBottom: '1.5rem' }}>{children}</ul>,
    li: ({ children }) => <li style={{ marginBottom: '0.5rem', lineHeight: '1.6' }}>{children}</li>,
    
    // Emphasis
    strong: ({ children }) => <strong style={{ fontWeight: 700, color: '#111827' }}>{children}</strong>,
    em: ({ children }) => <em style={{ fontStyle: 'italic', color: '#4b5563' }}>{children}</em>,
    
    // Code Blocks (Basic Styling)
    code: ({ node, inline, className, children, ...props }) => {
        const match = /language-(\w+)/.exec(className || '');
        // Inline code
        if (inline) {
            return <code className="bg-gray-200 text-red-700 px-1 py-0.5 rounded text-sm">{children}</code>;
        }
        // Block code: Ensures wide code blocks don't break the paper layout
        return (
            <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-white max-w-full">
                <code className={`language-${match ? match[1] : ''}`} {...props}>
                    {children}
                </code>
            </pre>
        );
    }
};