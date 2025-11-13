// src/components/LessonDetailSection.jsx (REVISED FOR REVIEWER NAVIGATION)

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  FileText,
  Plus,
  RefreshCw,
  Download,
  Zap,
  Trash2,
  MoreHorizontal,
  BookOpen,
  X,
  Maximize2,
  Edit2, // Added for the View/Edit button
} from "lucide-react";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext.jsx";

// API endpoint from environment variables
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

// --- Constants ---
const REVIEWER_TYPE = "reviewer";
const FLASHCARDS_TYPE = "flashcards";

// --- Utilities ---
const getViewerUrl = (rawFileUrl) => {
  return `https://docs.google.com/gview?url=${encodeURIComponent(
    rawFileUrl
  )}&embedded=true`;
};

// ... (useGeneratingText hook remains the same)
const useGeneratingText = (isGenerating) => {
  const [dots, setDots] = useState("");
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setDots((prev) => {
          if (prev.length >= 3) return "";
          return prev + ".";
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setDots("");
    }
  }, [isGenerating]);
  return isGenerating ? `Generating${dots}` : "";
};

// --- Components ---
const ContentCard = ({
  type,
  data,
  isGenerating,
  onGenerate,
  onRegenerate,
  onDelete,
  onDownload,
  onView, // 💡 NEW PROP for viewing/editing
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const generatingText = useGeneratingText(isGenerating);

  const Icon = type === REVIEWER_TYPE ? BookOpen : Zap;
  const isGenerated = !!data;

  // Menu component specific to this card (Remains mostly the same)
  const Menu = ({ data }) => (
    <div
      className="absolute right-0 top-10 z-20 w-48 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1">
        <button
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={() => {
            onRegenerate();
            setIsMenuOpen(false);
          }}
        >
          <RefreshCw className="w-4 h-4 mr-3 text-indigo-500" /> Regenerate
        </button>
        {type === REVIEWER_TYPE && onDownload && (
          <button
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => {
              onDownload(data.file_id);
              setIsMenuOpen(false);
            }}
          >
            <Download className="w-4 h-4 mr-3 text-green-500" /> Download (.md)
          </button>
        )}
        <button
          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          onClick={() => {
            onDelete(data.document_id, data.name);
            setIsMenuOpen(false);
          }}
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
      // 💡 REVISION: Make the entire content area clickable for viewing/editing
      return (
        <button 
            onClick={() => onView(data.file_id)} // Calls the onView handler
            className="flex flex-col items-center justify-center text-center w-full h-full p-4 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer"
        >
          <Icon className="w-12 h-12 text-indigo-600" />
          <p
            className="mt-3 text-sm font-semibold text-gray-800 truncate w-full px-2"
            title={data.name}
          >
            {data.name}
          </p>
          <span className="mt-2 text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors inline-flex items-center">
            <Edit2 className="w-3 h-3 mr-1" /> View & Edit {type === REVIEWER_TYPE ? "Reviewer" : "Flashcards"}
          </span>
        </button>
      );
    }

    // Not generated state (Remains the same)
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
          Generate {type === REVIEWER_TYPE ? "Reviewer" : "Flashcards"}
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 flex flex-col relative h-full min-h-[300px]">
      <h2 className="text-xl font-bold text-gray-800 capitalize mb-4">
        {type === REVIEWER_TYPE ? "Generated Reviewer" : "Generated Flashcards"}
      </h2>

      {/* Menu Button */}
      {isGenerated && !isGenerating && (
        <button
          className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors z-30"
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen((prev) => !prev);
          }}
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

// ... (FullScreenViewer component remains the same)

/**
 * Main Lesson Detail Section Component
 */
function LessonDetailSection() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // ... (State and Memoized values remain the same)
  const [rawFileApiUrl, setRawFileApiUrl] = useState(null);
  const [associations, setAssociations] = useState([]);
  const [isSourceLoading, setIsSourceLoading] = useState(true);
  const [isAssocLoading, setIsAssocLoading] = useState(true);
  const [isReviewerGenerating, setIsReviewerGenerating] = useState(false);
  const [isFlashcardsGenerating, setIsFlashcardsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const reviewerData = useMemo(
    () => associations.find((f) => f.type === REVIEWER_TYPE),
    [associations]
  );
  const flashcardsData = useMemo(
    () => associations.find((f) => f.type === FLASHCARDS_TYPE),
    [associations]
  );

  const viewerUrl = useMemo(() => {
    return rawFileApiUrl ? getViewerUrl(rawFileApiUrl) : null;
  }, [rawFileApiUrl]);

  // --- Handlers ---
  // ... (fetchSourceFile and fetchAssociations remain the same)
  const fetchSourceFile = useCallback(async () => {
    if (!fileId) {
      setError("Missing file ID in URL.");
      setIsSourceLoading(false);
      return;
    }

    setIsSourceLoading(true);
    try {
      const actualFileUrl = `${API_ENDPOINT}/cloud/file/view?file_id=${fileId}`;
      setRawFileApiUrl(actualFileUrl);
    } catch (err) {
      console.error("Source File Fetch Error:", err);
      setError("Could not prepare the lesson file viewing URL.");
    } finally {
      setIsSourceLoading(false);
    }
  }, [fileId]);

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
        params: { source_file_id: fileId },
      });

      if (response.data.success) {
        setAssociations(response.data.files);
      } else {
        setError("Failed to load associated study materials.");
      }
    } catch (err) {
      console.error("Association Fetch Error:", err);
      const detail =
        err.response?.data?.detail ||
        "Could not connect to the server or retrieve data.";
      setError(`Association error: ${detail}`);
    } finally {
      setIsAssocLoading(false);
    }
  }, [fileId, isAuthenticated, user?.$id]);

  useEffect(() => {
    fetchSourceFile();
    fetchAssociations();
  }, [fetchSourceFile, fetchAssociations]);

  // --- Reviewer View Handler ---
  // 💡 NEW HANDLER: Navigates to the new ReviewerViewer route
  const handleViewReviewer = useCallback((reviewerFileId) => {
    navigate(`/main/reviewer/${reviewerFileId}`);
  }, [navigate]);
  
  // ... (handleGenerate, handleDownloadReviewer, and handleDeleteAssociation remain the same)
  const handleGenerate = async (type) => { /* ... remains the same ... */ };
  const handleDownloadReviewer = async (reviewerFileId) => { /* ... remains the same ... */ };
  const handleDeleteAssociation = (documentId, name) => { /* ... remains the same ... */ };

  // --- Render Logic (Remains mostly the same) ---
  if (isSourceLoading || isAssocLoading) {
    return <Loader />;
  }

  if (isViewerOpen && rawFileApiUrl) {
    const lessonFileName = "Lesson File";
    return (
      <FullScreenViewer
        rawFileApiUrl={rawFileApiUrl}
        fileName={lessonFileName}
        onClose={() => setIsViewerOpen(false)}
      />
    );
  }

  if (error) { /* ... error state remains the same ... */ }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar (Remains the same) */}
      <nav className="bg-white shadow-md sticky top-0 z-50"> {/* ... */}</nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 truncate">
          Lesson: File ID: {fileId}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CARD 1: Live Lesson Viewer (Remains the same) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-indigo-100 flex flex-col overflow-hidden h-[80vh] min-h-[600px]">
            {/* ... viewer controls and iframe remain the same ... */}
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
            <div className="flex-grow overflow-auto p-2">
              {viewerUrl ? (
                <iframe
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

          {/* CARD 2 & 3: Reviewer & Flashcards */}
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
              onView={handleViewReviewer}
            />

            {/* Flashcards Card */}
            <ContentCard
              type={FLASHCARDS_TYPE}
              data={flashcardsData}
              isGenerating={isFlashcardsGenerating}
              onGenerate={() => handleGenerate(FLASHCARDS_TYPE)}
              onRegenerate={() => handleGenerate(FLASHCARDS_TYPE)}
              onDelete={(docId, name) => handleDeleteAssociation(docId, name)}
              onView={() => alert("Flashcard Viewer is not yet built!")} // Placeholder
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LessonDetailSection;