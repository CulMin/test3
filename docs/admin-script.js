document.addEventListener('DOMContentLoaded', function() {
    const calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        themeSystem: 'bootstrap5',
        editable: true,
        selectable: true,
        events: '/api/events',
        dateClick: function(info) {
            showEventModal(info.date);
        },
        eventClick: function(info) {
            showEventDetails(info.event);
        },
        eventDrop: function(info) {
            updateEvent(info.event);
        },
        eventResize: function(info) {
            updateEvent(info.event);
        }
    });

    calendar.render();

    // Add Event Button Click
    document.getElementById('addEventBtn').addEventListener('click', () => {
        showEventModal(new Date());
    });

    // Save Event
    document.getElementById('saveEvent').addEventListener('click', async () => {
        const title = document.getElementById('eventTitle').value;
        const start = document.getElementById('eventStart').value;
        const end = document.getElementById('eventEnd').value;
        const description = document.getElementById('eventDescription').value;
        const category = document.getElementById('eventCategory').value;

        if (!title || !start) {
            alert('Please fill in required fields');
            return;
        }

        const eventData = {
            title,
            start,
            end,
            description,
            category
        };

        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });

            if (response.ok) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('eventModal'));
                modal.hide();
                calendar.refetchEvents();
                updateStats();
            } else {
                alert('Error saving event');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error saving event');
        }
    });

    // Show Event Modal
    function showEventModal(date) {
        const modal = document.getElementById('eventModal');
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventStart').value = formatDateTime(date);
        document.getElementById('eventEnd').value = formatDateTime(new Date(date.getTime() + 3600000));
        document.getElementById('eventDescription').value = '';
        document.getElementById('eventCategory').value = 'general';
        
        new bootstrap.Modal(modal).show();
    }

    // Show Event Details
    function showEventDetails(event) {
        const modal = document.getElementById('eventDetailsModal');
        document.getElementById('eventTitleDetail').textContent = event.title;
        document.getElementById('eventTimeDetail').textContent = formatEventTime(event);
        document.getElementById('eventDescriptionDetail').textContent = event.extendedProps?.description || 'No description available';
        
        const categoryBadge = document.getElementById('eventCategoryDetail');
        const category = event.extendedProps?.category || 'general';
        categoryBadge.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categoryBadge.className = `badge bg-${getCategoryColor(category)}`;

        // Set up footer buttons
        const footer = modal.querySelector('.modal-footer');
        footer.innerHTML = `
            <button type="button" class="btn btn-danger" onclick="deleteEvent('${event.id}')">
                <i class="fas fa-trash"></i> Delete
            </button>
            <button type="button" class="btn btn-primary" onclick="editEvent('${event.id}')">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        `;

        new bootstrap.Modal(modal).show();
    }

    // Update Event
    async function updateEvent(event) {
        const eventData = {
            title: event.title,
            start: event.start.toISOString(),
            end: event.end?.toISOString(),
            description: event.extendedProps?.description,
            category: event.extendedProps?.category
        };

        try {
            const response = await fetch(`/api/events/${event.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });

            if (!response.ok) {
                throw new Error('Failed to update event');
            }

            calendar.refetchEvents();
            updateStats();
        } catch (error) {
            console.error('Error:', error);
            calendar.refetchEvents(); // Revert changes on error
        }
    }

    // Delete Event
    window.deleteEvent = async function(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) {
            return;
        }

        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('eventDetailsModal'));
                modal.hide();
                calendar.refetchEvents();
                updateStats();
            } else {
                alert('Error deleting event');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error deleting event');
        }
    };

    // Edit Event
    window.editEvent = function(eventId) {
        const event = calendar.getEventById(eventId);
        if (!event) return;

        const modal = document.getElementById('eventModal');
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventStart').value = formatDateTime(event.start);
        document.getElementById('eventEnd').value = event.end ? formatDateTime(event.end) : '';
        document.getElementById('eventDescription').value = event.extendedProps?.description || '';
        document.getElementById('eventCategory').value = event.extendedProps?.category || 'general';

        // Update save button to handle edit
        const saveButton = document.getElementById('saveEvent');
        saveButton.onclick = async () => {
            const updatedData = {
                title: document.getElementById('eventTitle').value,
                start: document.getElementById('eventStart').value,
                end: document.getElementById('eventEnd').value,
                description: document.getElementById('eventDescription').value,
                category: document.getElementById('eventCategory').value
            };

            try {
                const response = await fetch(`/api/events/${eventId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedData)
                });

                if (response.ok) {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('eventModal'));
                    modal.hide();
                    calendar.refetchEvents();
                    updateStats();
                } else {
                    alert('Error updating event');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error updating event');
            }
        };

        bootstrap.Modal.getInstance(document.getElementById('eventDetailsModal')).hide();
        new bootstrap.Modal(modal).show();
    };

    // Update Stats
    async function updateStats() {
        try {
            const response = await fetch('/api/events/stats');
            const stats = await response.json();
            
            document.getElementById('todayEventCount').textContent = stats.todayEvents;
            document.getElementById('upcomingMeetings').textContent = stats.upcomingMeetings;
            document.getElementById('pendingTasks').textContent = stats.pendingTasks;
            document.getElementById('completedTasks').textContent = stats.completedTasks;
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    // Helper Functions
    function formatDateTime(date) {
        return new Date(date).toISOString().slice(0, 16);
    }

    function formatEventTime(event) {
        const start = new Date(event.start);
        const end = event.end ? new Date(event.end) : null;
        
        const dateOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        
        return `${start.toLocaleDateString('en-US', dateOptions)} ${start.toLocaleTimeString('en-US', timeOptions)}${
            end ? ` - ${end.toLocaleTimeString('en-US', timeOptions)}` : ''
        }`;
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

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/admin';
        } catch (error) {
            console.error('Error logging out:', error);
        }
    });

    // Initial stats update
    updateStats();
});
