// src/components/LoginForm.jsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext.jsx'; // 👈 Import auth hook
import Loader from './Loader.jsx';

// Zod Schema for validation
const LoginSchema = z.object({
    email: z.string().email({ message: "Invalid email address." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

function LoginForm({ setIsSignup }) {
    const { login } = useAuth();
    const [authError, setAuthError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(LoginSchema),
    });

    const onSubmit = async (data) => {
        setAuthError(null);
        setIsSubmitting(true);
        try {
            // Attempt to log in using the context function
            await login(data.email, data.password);
            // Success: Redirect handled by AuthContext
        } catch (e) {
            // Appwrite error handling
            console.error("Appwrite Login Error:", e);
            // Use the actual Appwrite message for debugging
            setAuthError(`${e.message || e.toString()}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* ... Form title, error message ... */}
            {authError && (
                <div className="text-red-600 text-sm text-center bg-red-100 p-3 rounded-lg">{authError}</div>
            )}
            
            {/* Email Field */}
            <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                    type="email"
                    id="login-email"
                    placeholder="example@gmail.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                    {...register("email")}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600/70">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                    type="password"
                    id="login-password"
                    placeholder='********'
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                    {...register("password")}
                />
                {errors.password && <p className="mt-1 text-xs text-red-600/70">{errors.password.message}</p>}
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
                {isSubmitting ? <Loader forButton={true} /> : 'Log In'}
            </button>
            
            <p className="mt-4 text-center text-sm text-gray-600">
                Don't have an account? 
                <a onClick={() => setIsSignup(true)} className="font-medium text-indigo-600 hover:text-indigo-500 ml-1 cursor-pointer">Sign Up</a>
            </p>
        </form>
    );
}

export default LoginForm;