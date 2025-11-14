// src/components/CustomModal.jsx

import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

/**
 * Custom Modal Component for simple Alerts (Success/Error).
 * @param {{
 * message: string,
 * type: 'success' | 'error',
 * onClose: () => void
 * }} props
 */
const CustomModal = ({ message, type, onClose }) => {
    const isSuccess = type === 'success';

    const bgColor = isSuccess ? 'bg-indigo-600' : 'bg-red-600';
    const title = isSuccess ? 'Success!' : 'Error!';
    const Icon = isSuccess ? CheckCircle : XCircle;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/20 bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full transform transition-all duration-300 scale-100">
                <div className={`p-6 flex flex-col items-center ${isSuccess ? 'text-indigo-600' : 'text-red-600'}`}>
                    <Icon className="w-12 h-12 mb-4" />
                    <h3 className="text-xl font-bold mb-2 text-gray-800">{title}</h3>
                    <p className="text-center text-gray-600 mb-6">{message}</p>
                    <button
                        onClick={onClose}
                        className={`w-full py-3 rounded-lg text-white font-semibold transition-colors ${bgColor} hover:opacity-90`}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomModal;