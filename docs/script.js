document.addEventListener('DOMContentLoaded', async function() {
    let isAdmin = false;
    
    // Check admin status first
    try {
        const response = await fetch('/api/check-admin');
        const data = await response.json();
        isAdmin = data.isAdmin;
    } catch (error) {
        console.error('Error checking admin status:', error);
    }

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
        selectable: isAdmin,
        editable: isAdmin,
        eventStartEditable: isAdmin,
        eventDurationEditable: isAdmin,
        selectMirror: true,
        dayMaxEvents: true,
        events: '/api/events',
        eventClick: function(info) {
            if (isAdmin) {
                showEventDetails(info.event);
            } else {
                // For non-admin users, just show a popup with event details
                alert(`Event: ${info.event.title}\nTime: ${info.event.start.toLocaleString()}\nDescription: ${info.event.extendedProps.description || 'No description'}`);
            }
        },
        select: function(info) {
            if (isAdmin) {
                showAddEventModal(info);
            }
        },
        eventDrop: async function(info) {
            if (isAdmin) {
                try {
                    await updateEvent(info.event);
                } catch (error) {
                    info.revert();
                    alert('Failed to update event');
                }
            } else {
                info.revert();
            }
        },
        eventResize: async function(info) {
            if (isAdmin) {
                try {
                    await updateEvent(info.event);
                } catch (error) {
                    info.revert();
                    alert('Failed to update event');
                }
            } else {
                info.revert();
            }
        }
    });

    calendar.render();

    // Update UI based on admin status
    function updateUIForRole() {
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            el.style.display = isAdmin ? 'block' : 'none';
        });

        // Update navbar
        const navbar = document.querySelector('.navbar .container');
        if (isAdmin) {
            // Add admin controls if they don't exist
            if (!document.querySelector('#adminControls')) {
                const adminControls = document.createElement('div');
                adminControls.id = 'adminControls';
                adminControls.className = 'd-flex align-items-center';
                adminControls.innerHTML = `
                    <button class="btn btn-success me-2" id="addEventBtn">
                        <i class="fas fa-plus"></i> Add Event
                    </button>
                    <button class="btn btn-outline-danger" id="logoutBtn">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                `;
                navbar.appendChild(adminControls);

                // Add event listeners
                document.getElementById('addEventBtn').addEventListener('click', () => {
                    showAddEventModal();
                });

                document.getElementById('logoutBtn').addEventListener('click', async () => {
                    await fetch('/api/logout', { method: 'POST' });
                    window.location.reload();
                });
            }
        }
    }

    // Show event details modal
    function showEventDetails(event) {
        if (!isAdmin) return;

        const modal = document.getElementById('eventDetailsModal');
        document.getElementById('eventTitleDetail').textContent = event.title;
        document.getElementById('eventTimeDetail').textContent = `${event.start.toLocaleString()} - ${event.end ? event.end.toLocaleString() : 'N/A'}`;
        document.getElementById('eventDescriptionDetail').textContent = event.extendedProps.description || 'No description';
        document.getElementById('eventCategoryDetail').textContent = event.extendedProps.category || 'No category';

        // Add edit and delete buttons
        const footerButtons = modal.querySelector('.modal-footer');
        footerButtons.innerHTML = `
            <button type="button" class="btn btn-danger" id="deleteEventBtn">Delete</button>
            <button type="button" class="btn btn-primary" id="editEventBtn">Edit</button>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        `;

        // Add event listeners
        document.getElementById('deleteEventBtn').addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this event?')) {
                try {
                    const response = await fetch(`/api/events/${event.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        event.remove();
                        bootstrap.Modal.getInstance(modal).hide();
                        updateEventCounters();
                    }
                } catch (error) {
                    console.error('Error deleting event:', error);
                    alert('Failed to delete event');
                }
            }
        });

        document.getElementById('editEventBtn').addEventListener('click', () => {
            bootstrap.Modal.getInstance(modal).hide();
            showEditEventModal(event);
        });

        new bootstrap.Modal(modal).show();
    }

    // Show add event modal
    function showAddEventModal(info = null) {
        if (!isAdmin) return;

        const modal = document.getElementById('eventModal');
        const form = document.getElementById('eventForm');
        form.reset();

        if (info) {
            document.getElementById('eventStart').value = info.startStr;
            document.getElementById('eventEnd').value = info.endStr;
        }

        const saveButton = document.getElementById('saveEvent');
        const saveHandler = async () => {
            const eventData = {
                title: document.getElementById('eventTitle').value,
                start: document.getElementById('eventStart').value,
                end: document.getElementById('eventEnd').value,
                description: document.getElementById('eventDescription').value,
                category: document.getElementById('eventCategory').value
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
                    const newEvent = await response.json();
                    calendar.addEvent(newEvent);
                    bootstrap.Modal.getInstance(modal).hide();
                    updateEventCounters();
                }
            } catch (error) {
                console.error('Error adding event:', error);
                alert('Failed to add event');
            }
        };

        // Remove old event listener and add new one
        saveButton.removeEventListener('click', saveHandler);
        saveButton.addEventListener('click', saveHandler);

        new bootstrap.Modal(modal).show();
    }

    // Show edit event modal
    function showEditEventModal(event) {
        if (!isAdmin) return;

        const modal = document.getElementById('eventModal');
        const form = document.getElementById('eventForm');
        
        // Fill form with event data
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventStart').value = event.startStr;
        document.getElementById('eventEnd').value = event.endStr || '';
        document.getElementById('eventDescription').value = event.extendedProps.description || '';
        document.getElementById('eventCategory').value = event.extendedProps.category || '';

        const saveButton = document.getElementById('saveEvent');
        const saveHandler = async () => {
            const eventData = {
                title: document.getElementById('eventTitle').value,
                start: document.getElementById('eventStart').value,
                end: document.getElementById('eventEnd').value,
                description: document.getElementById('eventDescription').value,
                category: document.getElementById('eventCategory').value
            };

            try {
                const response = await fetch(`/api/events/${event.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(eventData)
                });

                if (response.ok) {
                    const updatedEvent = await response.json();
                    event.setProp('title', updatedEvent.title);
                    event.setStart(updatedEvent.start);
                    event.setEnd(updatedEvent.end);
                    event.setExtendedProp('description', updatedEvent.description);
                    event.setExtendedProp('category', updatedEvent.category);
                    bootstrap.Modal.getInstance(modal).hide();
                    updateEventCounters();
                }
            } catch (error) {
                console.error('Error updating event:', error);
                alert('Failed to update event');
            }
        };

        // Remove old event listener and add new one
        saveButton.removeEventListener('click', saveHandler);
        saveButton.addEventListener('click', saveHandler);

        new bootstrap.Modal(modal).show();
    }

    // Update event helper function
    async function updateEvent(event) {
        const response = await fetch(`/api/events/${event.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: event.title,
                start: event.start,
                end: event.end,
                description: event.extendedProps.description,
                category: event.extendedProps.category
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update event');
        }

        updateEventCounters();
    }

    // Update event counters
    async function updateEventCounters() {
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

    // Initialize UI and event counters
    updateUIForRole();
    updateEventCounters();

    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
    });
});
