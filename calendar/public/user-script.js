document.addEventListener('DOMContentLoaded', async function() {
    // Initialize calendar
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        themeSystem: 'bootstrap5',
        events: '/api/events',
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        },
        eventClick: function(info) {
            showEventDetails(info.event);
        },
        eventDidMount: function(info) {
            // Add tooltip
            info.el.title = `${info.event.title}\n${formatEventTime(info.event)}`;
        }
    });

    calendar.render();

    // Refresh calendar every minute to keep it updated
    setInterval(() => {
        calendar.refetchEvents();
    }, 60000);

    // View toggle functionality
    document.querySelectorAll('[data-view]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.target.getAttribute('data-view');
            document.getElementById('calendarView').style.display = view === 'calendar' ? 'block' : 'none';
            document.getElementById('listView').style.display = view === 'list' ? 'block' : 'none';
            
            if (view === 'list') {
                updateEventsList();
            }
        });
    });

    // Update events list
    async function updateEventsList() {
        try {
            const response = await fetch('/api/events');
            const events = await response.json();
            
            // Sort events by start date
            events.sort((a, b) => new Date(a.start) - new Date(b.start));
            
            const listContainer = document.getElementById('eventsList');
            listContainer.innerHTML = '';
            
            const now = new Date();
            let currentDate = null;
            
            events.forEach(event => {
                const startDate = new Date(event.start);
                const dateStr = startDate.toLocaleDateString();
                
                // Add date header if it's a new date
                if (dateStr !== currentDate) {
                    currentDate = dateStr;
                    const dateHeader = document.createElement('div');
                    dateHeader.className = 'list-group-item list-group-item-light';
                    dateHeader.innerHTML = `<h6 class="mb-0">${formatDate(startDate, true)}</h6>`;
                    listContainer.appendChild(dateHeader);
                }
                
                const listItem = document.createElement('div');
                listItem.className = 'list-group-item list-group-item-action';
                listItem.innerHTML = `
                    <div class="d-flex w-100 justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${event.title}</h6>
                            <small class="text-muted">
                                <i class="fas fa-clock"></i> ${formatTime(new Date(event.start))}
                                ${event.end ? ` - ${formatTime(new Date(event.end))}` : ''}
                            </small>
                        </div>
                        <button class="btn btn-sm btn-outline-primary view-details" data-event='${JSON.stringify(event)}'>
                            View Details
                        </button>
                    </div>
                `;
                
                listContainer.appendChild(listItem);
            });

            // Add event listeners to view buttons
            document.querySelectorAll('.view-details').forEach(button => {
                button.addEventListener('click', () => {
                    const event = JSON.parse(button.getAttribute('data-event'));
                    showEventDetails(event);
                });
            });
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    }

    // Show event details
    function showEventDetails(event) {
        const modal = document.getElementById('eventDetailsModal');
        document.getElementById('eventTitleDetail').textContent = event.title;
        document.getElementById('eventTimeDetail').textContent = formatEventTime(event);
        document.getElementById('eventDescriptionDetail').textContent = 
            event.extendedProps?.description || event.description || 'No description available';
        
        const categoryBadge = document.getElementById('eventCategoryDetail');
        const category = event.extendedProps?.category || event.category || 'general';
        categoryBadge.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categoryBadge.className = `badge bg-${getCategoryColor(category)}`;

        // Set up export buttons
        document.querySelectorAll('.export-calendar').forEach(button => {
            button.onclick = () => exportEvent(event, button.getAttribute('data-type'));
        });

        new bootstrap.Modal(modal).show();
    }

    // Export event to different calendar formats
    function exportEvent(event, type) {
        const eventData = {
            title: event.title,
            start: new Date(event.start),
            end: event.end ? new Date(event.end) : null,
            description: event.extendedProps?.description || event.description || '',
            location: event.extendedProps?.location || ''
        };

        switch (type) {
            case 'google':
                window.open(createGoogleCalendarUrl(eventData), '_blank');
                break;
            case 'outlook':
                window.open(createOutlookCalendarUrl(eventData), '_blank');
                break;
            case 'ics':
                downloadICSFile(eventData);
                break;
        }
    }

    // Create Google Calendar URL
    function createGoogleCalendarUrl(event) {
        const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
        const title = encodeURIComponent(event.title);
        const start = formatGoogleDate(event.start);
        const end = event.end ? formatGoogleDate(event.end) : formatGoogleDate(new Date(event.start.getTime() + 3600000));
        const description = encodeURIComponent(event.description);
        
        return `${baseUrl}&text=${title}&dates=${start}/${end}&details=${description}`;
    }

    // Create Outlook Calendar URL
    function createOutlookCalendarUrl(event) {
        const baseUrl = 'https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent';
        const title = encodeURIComponent(event.title);
        const start = event.start.toISOString();
        const end = event.end ? event.end.toISOString() : new Date(event.start.getTime() + 3600000).toISOString();
        const description = encodeURIComponent(event.description);
        
        return `${baseUrl}&subject=${title}&startdt=${start}&enddt=${end}&body=${description}`;
    }

    // Download ICS file
    function downloadICSFile(event) {
        const icsContent = createICSContent(event);
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Create ICS content
    function createICSContent(event) {
        const formatICSDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formatICSDate(event.start)}
DTEND:${formatICSDate(event.end || new Date(event.start.getTime() + 3600000))}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
END:VEVENT
END:VCALENDAR`;
    }

    // Helper functions
    function formatDate(date, includeDay = false) {
        const options = {
            weekday: includeDay ? 'long' : undefined,
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        };
        return date.toLocaleDateString('en-US', options);
    }

    function formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatEventTime(event) {
        const start = new Date(event.start);
        const end = event.end ? new Date(event.end) : null;
        
        return `${formatDate(start)} ${formatTime(start)}${end ? ` - ${formatTime(end)}` : ''}`;
    }

    function formatGoogleDate(date) {
        return date.toISOString().replace(/-|:|\.\d{3}/g, '');
    }

    function getCategoryColor(category) {
        const colors = {
            meetings: 'primary',
            deadlines: 'danger',
            personal: 'success',
            general: 'secondary'
        };
        return colors[category.toLowerCase()] || 'secondary';
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
    });

    // Initial list update if in list view
    if (document.getElementById('listView').style.display === 'block') {
        updateEventsList();
    }
});
