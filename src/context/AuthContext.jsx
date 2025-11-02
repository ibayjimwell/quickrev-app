// src/context/AuthContext.js (REVISED - REMOVED JWT FUNCTION)

import React, { createContext, useContext, useState, useEffect } from 'react';
import { account } from '../appwrite/client.js';
import { useNavigate } from 'react-router-dom';
import { ID } from 'appwrite';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // 1. Check Auth Status on Load
    useEffect(() => {
        const checkUserStatus = async () => {
            try {
                const currentUser = await account.get();
                setUser(currentUser);
            } catch (error) {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkUserStatus();
    }, []); // Run only once on mount

    // 2. Login Function (Creates the session cookie and updates state)
    const login = async (email, password) => {
        try {
            await account.createEmailPasswordSession(email, password); 
            
            // Fetch the user object after session creation
            const currentUser = await account.get();
            setUser(currentUser);
            navigate('/main/dashboard'); 
        } catch (error) {
            console.error('Login Failed:', error);
            throw error;
        }
    };

    // 3. Sign-up Function (Creates user and automatically logs them in)
    const signup = async (email, password, name) => {
        try {
            // 1. Create the user account
            const newUser = await account.create(
                ID.unique(),
                email,
                password,
                name 
            );
            
            // 2. Automatically log in the user (Creates session cookie and updates state via login())
            await login(email, password); 

            return newUser;
        } catch (error) {
            console.error('Signup Failed:', error);
            throw error; 
        }
    };
    
    // 4. Logout Function (Deletes the session cookie)
    const logout = async () => {
        try {
            await account.deleteSession('current');
            setUser(null);
            navigate('/'); 
        } catch (error) {
            console.error('Logout Failed:', error);
        }
    };

    // 5. ❌ REMOVED: getJwtToken function is gone.
    
    // 💡 REMOVED: getJwtToken from the value object
    const value = {
        user,
        isLoading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);