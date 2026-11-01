// src/hooks/useIdleLogout.js
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function useIdleLogout() {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const lastActivityRef = useRef(Date.now());

    useEffect(() => {
        const updateActivity = () => {
            lastActivityRef.current = Date.now();
        };

        const checkIdle = () => {
            const timeSinceLastActivity = Date.now() - lastActivityRef.current;

            if (timeSinceLastActivity >= IDLE_TIMEOUT_MS) {
                // 1. Clear the user session
                logout();

                // 2. Redirect to your timeout page
                // 👇 IMPORTANT: Change '/session-expired' to whatever your
                // desktop version uses (e.g., '/login?timeout=true' or '/timeout')
                navigate('/session-expired', { replace: true });
            }
        };

        // Listen to BOTH Desktop and Mobile events
        const events = [
            'mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'touchmove', 'click'
        ];

        events.forEach(event =>
            window.addEventListener(event, updateActivity, { passive: true })
        );

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // If the user unlocks their phone, check immediately
                checkIdle();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Check every 10 seconds instead of setting a single 15-minute timer
        // (This prevents mobile browsers from pausing the timer)
        const interval = setInterval(checkIdle, 10000);

        return () => {
            events.forEach(event => window.removeEventListener(event, updateActivity));
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(interval);
        };
    }, [logout, navigate]);
}