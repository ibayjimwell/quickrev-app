// src/components/SignupForm.jsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, X } from 'lucide-react'; // For password checklist
import { useAuth } from '../context/AuthContext.jsx'; 
import Loader from './Loader.jsx';

// --- Zod Schema with Password Rules ---
const passwordRules = z.string().min(8, "Must be at least 8 characters");

const SignupSchema = z.object({
    firstName: z.string().min(2, "Required").max(50, "Too long").regex(/^[A-Za-z\s'-]+$/, "Invalid name format"),
    lastName: z.string().min(2, "Required").max(50, "Too long").regex(/^[A-Za-z\s'-]+$/, "Invalid name format"),
    email: z.string().email({ message: "Must be a valid email address." }),
    password: passwordRules
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[0-9]/, "Must contain a number")
        .regex(/[^a-zA-Z0-9]/, "Must contain a symbol/special character"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
});

// --- Password Checklist Component ---
const PasswordChecklist = ({ password }) => {
    const checks = [
        { label: "8 characters minimum", isValid: password.length >= 8 },
        { label: "Lowercase letter", isValid: /[a-z]/.test(password) },
        { label: "Uppercase letter", isValid: /[A-Z]/.test(password) },
        { label: "A number", isValid: /[0-9]/.test(password) },
        { label: "A special character", isValid: /[^a-zA-Z0-9]/.test(password) },
    ];

    return (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
            {checks.map((check, index) => (
                <li key={index} className={`flex items-center ${check.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {check.isValid ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                    {check.label}
                </li>
            ))}
        </ul>
    );
};

// --- SignupForm Component ---
function SignupForm({ setIsSignup }) {
    const { signup } = useAuth();
    const [authError, setAuthError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { 
        register, 
        handleSubmit, 
        watch, 
        formState: { errors, isValid } 
    } = useForm({
        resolver: zodResolver(SignupSchema),
        mode: "onChange", // 👈 Validate while typing
    });

    const passwordValue = watch("password", ""); // Watch password input for checklist

    const onSubmit = async (data) => {
        setAuthError(null);
        setIsSubmitting(true);
        try {
            const fullName = `${data.firstName} ${data.lastName}`;
            // Attempt to sign up and auto-login
            await signup(data.email, data.password, fullName);
            // Success: Redirect handled by AuthContext
        } catch (e) {
            // Appwrite error handling (e.g., email already exists)
            setAuthError(e.message || "Registration failed. Please try a different email.");
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

            {/* Name Fields */}
            <div className="flex space-x-4">
                <div className="flex-1">
                    <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                        type="text"
                        id="first-name"
                        placeholder="John"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                        {...register("firstName")}
                    />
                    {errors.firstName && <p className="mt-1 text-xs text-red-600/70">{errors.firstName.message}</p>}
                </div>
                <div className="flex-1">
                    <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                        type="text"
                        id="last-name"
                        placeholder="Doe"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                        {...register("lastName")}
                    />
                    {errors.lastName && <p className="mt-1 text-xs text-red-600/70">{errors.lastName.message}</p>}
                </div>
            </div>

            {/* Email Field */}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                    type="email"
                    id="email"
                    placeholder="example@gmail.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                    {...register("email")}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600/70">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Create a Password</label>
                <input
                    type="password"
                    id="password"
                    placeholder='********'
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                    {...register("password")}
                />
                <PasswordChecklist password={passwordValue} /> {/* Checklist */}
                {errors.password && <p className="mt-1 text-xs text-red-600/70">{errors.password.message}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm a Password</label>
                <input
                    type="password"
                    id="confirm-password"
                    placeholder='********'
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                    {...register("confirmPassword")}
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-600/70">{errors.confirmPassword.message}</p>}
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                // Disable if form is invalid OR submission is in progress
                disabled={!isValid || isSubmitting} 
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
                {isSubmitting ? <Loader forButton={true} /> : 'Create Account'}
            </button>
            
            <p className="mt-4 text-center text-sm text-gray-600">
                Already have an account? 
                <a onClick={() => setIsSignup(false)} className="font-medium text-indigo-600 hover:text-indigo-500 ml-1 cursor-pointer">Log In</a>
            </p>
        </form>
    );
}

export default SignupForm;