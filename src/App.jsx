// src/App.jsx (REVISED)

import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import MainPage from "./pages/MainPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from './context/AuthContext';
import LessonDetailSection from './sections/LessonDetailSection';
import ReviewerViewer from './sections/ReviewerViewer'; // 💡 NEW IMPORT
import Loader from './components/Loader';

function App() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        // Optional: Show a full-page loading spinner while checking auth status
        return <Loader />;
    }

    return (
        <Routes>
            {/* 1. Public Routes */}
            <Route 
                path="/auth/*" 
                element={isAuthenticated ? <Navigate to="/main/dashboard" replace /> : <AuthPage />} 
            />

            {/* Root Route: Redirects to dashboard if logged in, or auth if logged out. */}
            <Route 
                path="/" 
                element={isAuthenticated ? <Navigate to="/main/dashboard" replace /> : <Navigate to="/auth" replace />} 
            />
            
            {/* 2. Protected Routes */}
            
            {/* Route for all general sections handled by MainPage (e.g., /main/dashboard, /main/lessons) */}
            <Route 
                path="/main/*" 
                element={
                    <ProtectedRoute>
                        <MainPage />
                    </ProtectedRoute>
                } 
            />
            
            {/* Detailed Lesson View */}
            <Route 
                path="/main/lesson/:fileId" 
                element={
                    <ProtectedRoute>
                        <LessonDetailSection />
                    </ProtectedRoute>
                } 
            />

            {/* 💡 NEW ROUTE: Reviewer View/Edit */}
            <Route 
                path="/main/reviewer/:reviewerFileId" 
                element={
                    <ProtectedRoute>
                        <ReviewerViewer />
                    </ProtectedRoute>
                } 
            />

            {/* 3. Fallback 404 Route */}
            <Route path="*" element={<h1 className="p-10 text-xl font-bold">404: Page Not Found</h1>} />
        </Routes>
    );
}

export default App;