// sw.js — Service Worker
// Handles background sync and the 7AM daily notification

const CACHE_NAME = 'homeserver-v1';

self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(clients.claim());
});

// Listen for the alarm message from the main app
self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SCHEDULE_NOTIFICATION') {
        scheduleNotification();
    }
});

async function scheduleNotification() {
    const now = new Date();
    const next = new Date();

    // Set target to 7:00 AM today
    next.setHours(7, 0, 0, 0);

    // If 7AM already passed today, schedule for tomorrow
    if (next <= now) next.setDate(next.getDate() + 1);

    const delay = next - now;

    setTimeout(async () => {
        try {
            // Fetch today's tasks from the server
            const res = await fetch('/api/calendar/today');
            const tasks = await res.json();

            if (tasks.length === 0) {
                showNotification('No tasks today', 'You have nothing scheduled for today.');
            } else {
                const list = tasks.map(t => `• ${t.title}`).join('\n');
                showNotification(`${tasks.length} task${tasks.length > 1 ? 's' : ''} today`, list);
            }
        } catch (err) {
            console.error('Notification fetch failed:', err);
        }

        // Schedule again for tomorrow
        scheduleNotification();
    }, delay);
}

function showNotification(title, body) {
    self.registration.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png'
    });
}