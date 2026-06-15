import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';

/**
 * useRoutineNotifications
 * Manages browser push notifications for daily skincare routine reminders.
 * Stores user preferences in localStorage.
 */
const useRoutineNotifications = () => {
    const [permission, setPermission] = useState(Notification?.permission || 'default');
    const [enabled, setEnabled] = useState(() => localStorage.getItem('routine_notif') === 'true');
    const [times, setTimes] = useState(() => {
        try { return JSON.parse(localStorage.getItem('routine_times') || '["08:00","21:00"]'); }
        catch { return ['08:00', '21:00']; }
    });

    // Request notification permission
    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            toast.error('Your browser does not support desktop notifications.');
            return;
        }
        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
    }, []);

    // Enable or disable notifications
    const toggleNotifications = useCallback(async () => {
        if (!enabled) {
            const perm = permission === 'granted' ? 'granted' : await requestPermission();
            if (perm === 'granted') {
                setEnabled(true);
                localStorage.setItem('routine_notif', 'true');
                sendNotification('GlowAI Reminders Activated!', 'You will receive skincare routine reminders at ' + times.join(' and ') + '.');
            }
        } else {
            setEnabled(false);
            localStorage.setItem('routine_notif', 'false');
        }
    }, [enabled, permission, times, requestPermission]);

    // Send a test notification now
    const sendNotification = useCallback((title, body) => {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/images/consultant_avatar.png',
                badge: '/images/consultant_avatar.png',
                tag: 'glowai-routine',
                requireInteraction: false,
            });
        }
    }, []);

    const sendTestNotification = useCallback(() => {
        sendNotification('Test: GlowAI Skincare Reminder', 'This is how your routine reminder will appear!');
    }, [sendNotification]);

    // Update reminder times
    const updateTimes = useCallback((newTimes) => {
        setTimes(newTimes);
        localStorage.setItem('routine_times', JSON.stringify(newTimes));
    }, []);

    // Check every minute if it's time to send a notification
    useEffect(() => {
        if (!enabled || permission !== 'granted') return;

        const checkTime = () => {
            const now = new Date();
            const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const messages = {
                morning: ['Time for your morning skincare routine!', 'Cleanse, tone, and apply SPF — your skin will thank you.'],
                evening: ['Evening skincare reminder!', "Don't forget to remove makeup and apply your night serum."],
            };
            times.forEach((t, idx) => {
                if (current === t) {
                    const isEvening = idx >= 1;
                    const msg = isEvening ? messages.evening : messages.morning;
                    sendNotification(msg[0], msg[1]);
                }
            });
        };

        const interval = setInterval(checkTime, 60000);
        return () => clearInterval(interval);
    }, [enabled, times, permission, sendNotification]);

    return {
        permission,
        enabled,
        times,
        requestPermission,
        toggleNotifications,
        sendTestNotification,
        updateTimes,
    };
};

export default useRoutineNotifications;
