# Modern Calendar Application

A full-featured calendar application with admin and user views, built with Node.js, Express, and FullCalendar.

## Features

### User View
- View all events in calendar or list format
- Export events to personal calendars (Google Calendar, Outlook, ICS)
- Dark/Light mode toggle
- Responsive design for all devices
- View events by day, week, or month

### Admin View
- Secure admin login with JWT authentication
- Create, edit, and delete events
- Drag and drop events to reschedule
- Resize events to change duration
- Event categories with color coding
- Event statistics dashboard
- Full event management capabilities

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd calendar
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   PORT=3000
   JWT_SECRET=your-super-secret-key-change-this-in-production
   ```

## Running the Application

1. Start the server:
   ```bash
   node server.js
   ```

2. Access the application:
   - User view: `http://localhost:3000`
   - Admin login: `http://localhost:3000/admin`

## Admin Login Credentials

- Username: `admin`
- Password: `admin123`


## Testing the Application

### Testing User View

1. Open `http://localhost:3000`
2. You should see:
   - Calendar view with any existing events
   - View toggle (Calendar/List)
   - Theme toggle (Light/Dark)
   - Ability to view event details
   - Export options for events

### Testing Admin Features

1. Go to `http://localhost:3000/admin`
2. Log in with admin credentials
3. Test event creation:
   - Click "Add Event" button
   - Click any date on calendar
   - Fill in event details
   - Save and verify it appears
4. Test event modification:
   - Drag and drop events
   - Resize events
   - Edit event details
   - Delete events
5. Test event categories:
   - Create events with different categories
   - Verify color coding
6. Test statistics:
   - Check if stats update when adding/removing events
   - Verify today's events count
   - Check upcoming meetings count
   - Verify task counts

### Testing Event Export

1. Click any event in user view
2. Test export options:
   - Google Calendar
   - Outlook Calendar
   - ICS file download

## Project Structure

```
calendar/
├── public/               # Static files
│   ├── index.html       # User view
│   ├── admin-login.html # Admin login page
│   ├── admin-dashboard.html # Admin dashboard
│   ├── user-script.js   # User view functionality
│   ├── admin-script.js  # Admin functionality
│   └── style.css        # Styles
├── server.js            # Express server and API
├── package.json         # Dependencies
└── .env                 # Environment variables
```

## API Endpoints

### Public Endpoints
- `GET /api/events` - Get all events
- `POST /api/login` - Admin login
- `POST /api/logout` - Logout

### Protected Admin Endpoints
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/stats` - Get event statistics

## Security Features

- JWT-based authentication
- HTTP-only cookies
- Protected admin routes
- Input validation
- XSS protection via content security policy
- CSRF protection

## Browser Compatibility

Tested and working on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Known Limitations

- In-memory event storage (resets on server restart)
- Basic authentication system
- Limited to single admin user

## Future Improvements

1. Database Integration
   - Persist events across server restarts
   - User management system
   - Event history and audit logs

2. Enhanced Security
   - Environment-based configuration
   - Rate limiting
   - Input sanitization
   - Password hashing

3. Additional Features
   - Event reminders
   - Recurring events
   - Event sharing
   - Multiple calendars
   - User registration
   - Role-based access control

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email [your-email] or open an issue in the repository.
