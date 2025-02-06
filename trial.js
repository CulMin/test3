require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve admin dashboard from public directory
app.use('/admin-dashboard', express.static(path.join(__dirname, 'public/admin-dashboard.html')));

// In-memory storage (replace with a database in production)
let events = [];
const adminCredentials = {
    username: 'admin',
    password: 'admin123' // Store plain password temporarily for testing
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Access denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Middleware to check if user is admin
const checkAdmin = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/admin');
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        if (verified.isAdmin) {
            next();
        } else {
            res.redirect('/admin');
        }
    } catch (err) {
        res.redirect('/admin');
    }
};

// Debug endpoint to check current events
app.get('/api/debug/events', (req, res) => {
    res.json({ events });
});

// Login route
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password }); // Debug log

    if (username !== adminCredentials.username || password !== adminCredentials.password) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ isAdmin: true }, process.env.JWT_SECRET || 'your-secret-key');
    res.cookie('token', token, { httpOnly: true });
    res.json({ success: true });
});

// Logout route
app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

// Get events endpoint - accessible to both admin and users
app.get('/api/events', (req, res) => {
    console.log('Current events in memory:', events); // Debug log
    
    try {
        const token = req.cookies.token;
        let isAdmin = false;
        
        if (token) {
            try {
                const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                isAdmin = verified.isAdmin;
            } catch (err) {
                // Not an admin, continue as regular user
            }
        }

        // Map events based on user role
        const mappedEvents = events.map(event => ({
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            description: event.description,
            category: event.category,
            color: getCategoryColor(event.category),
            editable: isAdmin,
            deletable: isAdmin
        }));

        console.log('Sending mapped events:', mappedEvents); // Debug log
        res.json(mappedEvents);
    } catch (error) {
        console.error('Error getting events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add new event (admin only)
app.post('/api/events', checkAdmin, (req, res) => {
    try {
        const event = {
            id: Date.now().toString(),
            title: req.body.title,
            start: new Date(req.body.start).toISOString(),
            end: req.body.end ? new Date(req.body.end).toISOString() : null,
            description: req.body.description || '',
            category: req.body.category || 'general'
        };
        
        events.push(event);
        console.log('New event added:', event);
        console.log('Current events:', events);
        
        res.json(event);
    } catch (error) {
        console.error('Error adding event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update event (admin only)
app.put('/api/events/:id', checkAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const eventIndex = events.findIndex(e => e.id === id);
        
        if (eventIndex === -1) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const updatedEvent = {
            ...events[eventIndex],
            ...req.body,
            id,
            start: new Date(req.body.start).toISOString(),
            end: req.body.end ? new Date(req.body.end).toISOString() : null
        };

        events[eventIndex] = updatedEvent;
        console.log('Event updated:', updatedEvent);
        
        res.json(updatedEvent);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete event (admin only)
app.delete('/api/events/:id', checkAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const initialLength = events.length;
        events = events.filter(e => e.id !== id);
        
        if (events.length === initialLength) {
            return res.status(404).json({ error: 'Event not found' });
        }

        console.log('Event deleted, remaining events:', events);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper function to get category color
function getCategoryColor(category) {
    const colors = {
        meetings: '#0d6efd',  // Bootstrap primary
        deadlines: '#dc3545', // Bootstrap danger
        personal: '#198754',  // Bootstrap success
        general: '#6c757d'    // Bootstrap secondary
    };
    return colors[category?.toLowerCase()] || colors.general;
}

// Get events stats
app.get('/api/events/stats', (req, res) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const stats = {
        todayEvents: events.filter(event => 
            new Date(event.start) >= todayStart && new Date(event.start) < todayEnd
        ).length,
        upcomingMeetings: events.filter(event => 
            new Date(event.start) >= now && event.category === 'meetings'
        ).length,
        pendingTasks: events.filter(event => 
            new Date(event.start) >= now && event.category === 'deadlines'
        ).length,
        completedTasks: events.filter(event => 
            new Date(event.end) < now && event.category === 'deadlines'
        ).length
    };

    res.json(stats);
});

// Check admin status
app.get('/api/check-admin', (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ isAdmin: false });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        res.json({ isAdmin: verified.isAdmin });
    } catch (err) {
        res.json({ isAdmin: false });
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
});

app.get('/events-calendar', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/gallery', (req, res) => {
    res.sendFile(path.join(__dirname, '/gallery.html'));
});

app.get('/about-us', (req, res) => {
    res.sendFile(path.join(__dirname, '/about-us.html'));
});

app.get('/admin', (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            if (verified.isAdmin) {
                res.redirect('/admin-dashboard');
                return;
            }
        } catch (err) {
            // Invalid token, continue to serve login page
        }
    }
    res.sendFile(path.join(__dirname, 'public/admin-login.html'));
});

app.get('/admin-dashboard', checkAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin-dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
