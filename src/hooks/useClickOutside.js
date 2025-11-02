// src/hooks/useClickOutside.js

import { useEffect } from 'react';

/**
 * Hook that alerts clicks outside of the passed ref
 */
export default function useClickOutside(ref, callback) {
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                callback();
            }
        };

        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Unbind the event listener on cleanup
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref, callback]);
}