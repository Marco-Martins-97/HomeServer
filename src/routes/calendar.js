// calendar.js — Google Calendar integration via OAuth2

const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '../../token.json');

// Create the OAuth2 client using credentials from .env
function getOAuthClient() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
}

// Load saved token from disk if it exists
function loadToken(oauth2Client) {
    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
        oauth2Client.setCredentials(token);

        // Auto-save refreshed tokens
        oauth2Client.on('tokens', (tokens) => {
            const current = JSON.parse(fs.readFileSync(TOKEN_PATH));
            const updated = { ...current, ...tokens };
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(updated));
        });

        return true;
    }
    return false;
}

// GET /api/calendar/auth — redirects to Google consent screen
router.get('/auth', (req, res) => {
    const oauth2Client = getOAuthClient();
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',  // offline = we get a refresh token
        prompt: 'consent',       // force consent screen to always get refresh token
        scope: ['https://www.googleapis.com/auth/calendar']
    });
    res.redirect(url);
});

// GET /api/calendar/callback — Google redirects here after user consents
router.get('/callback', async (req, res) => {
    const { code } = req.query;
    const oauth2Client = getOAuthClient();

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Save token to disk for future use
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

        res.redirect('/?tab=calendar');
    } catch (err) {
        console.error('OAuth callback error:', err);
        res.status(500).send('Authentication failed');
    }
});

// GET /api/calendar/status — check if we're authenticated
router.get('/status', (req, res) => {
    const oauth2Client = getOAuthClient();
    const authenticated = loadToken(oauth2Client);
    res.json({ authenticated });
});

// GET /api/calendar/events — fetch upcoming events
router.get('/events', async (req, res) => {
    const oauth2Client = getOAuthClient();

    if (!loadToken(oauth2Client)) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: new Date().toISOString(),   // from now
            maxResults: 20,                       // next 20 events
            singleEvents: true,
            orderBy: 'startTime'
        });

        const events = response.data.items.map(e => ({
            id: e.id,
            title: e.summary || '(no title)',
            start: e.start.dateTime || e.start.date,
            end: e.end.dateTime || e.end.date,
            location: e.location || null,
            description: e.description || null,
            allDay: !e.start.dateTime  // all-day events have date, not dateTime
        }));

        res.json(events);
    } catch (err) {
        console.error('Calendar fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// POST /api/calendar/events — create a new event
router.post('/events', async (req, res) => {
    const oauth2Client = getOAuthClient();

    if (!loadToken(oauth2Client)) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, start, end, description } = req.body;

    if (!title || !start || !end) {
        return res.status(400).json({ error: 'Title, start and end are required' });
    }

    try {
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const event = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: title,
                description: description || '',
                start: { dateTime: start },
                end: { dateTime: end }
            }
        });

        res.json({ id: event.data.id, title: event.data.summary });
    } catch (err) {
        console.error('Event create error:', err);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// DELETE /api/calendar/events/:id — delete an event
router.delete('/events/:id', async (req, res) => {
    const oauth2Client = getOAuthClient();

    if (!loadToken(oauth2Client)) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: req.params.id
        });
        res.json({ success: true });
    } catch (err) {
        console.error('Event delete error:', err);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

module.exports = router;