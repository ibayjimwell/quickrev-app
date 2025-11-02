// src/components/ProtectedRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        // Show a loading spinner while checking authentication status
        return <div>Loading...</div>; 
    }

    if (!isAuthenticated) {
        // Redirect them to the login page if not authenticated
        return <Navigate to="/auth" replace />;
    }

    return children;
};

export default ProtectedRoute;