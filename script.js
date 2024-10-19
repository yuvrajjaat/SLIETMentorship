const MentorshipData = {
    facultyData: [
        {
            id: 1,
            name: "Dr. Birmohan Singh",
            role: "Professor",
            qualification: "Ph.D., M.E.",
            email: "birmohansingh@sliet.ac.in",
            phone: "+91-1672-253208",
            expertise: ["Computer Science", "Software Engineering"],
            availableSlots: [
                "09:00 AM - 10:00 AM",
                "10:00 AM - 11:00 AM",
                "02:00 PM - 03:00 PM",
                "04:00 AM - 05:00 AM"
            ]
        },
        {
            id: 2,
            name: "Dr. Damanpreet Singh",
            role: "Professor",
            qualification: "Ph.D., M.Tech, B.Tech.",
            email: "damanpreets@sliet.ac.in",
            phone: "+91-1672-253210",
            expertise: ["Data Structures", "Algorithms"],
            availableSlots: [
                "11:00 AM - 12:00 PM",
                "03:00 PM - 04:00 PM"
            ]
        }
    ],
    bookings: [],
    messages: {},

    saveBookings() {
        localStorage.setItem('mentorship_bookings', JSON.stringify(this.bookings));
    },

    loadBookings() {
        const saved = localStorage.getItem('mentorship_bookings');
        this.bookings = saved ? JSON.parse(saved) : [];
    },

    saveMessages() {
        localStorage.setItem('mentorship_messages', JSON.stringify(this.messages));
    },

    loadMessages() {
        const saved = localStorage.getItem('mentorship_messages');
        this.messages = saved ? JSON.parse(saved) : {};
    },

    addBooking(booking) {
        this.bookings.push(booking);
        this.saveBookings();

        const bookingDate = new Date(`${booking.date}T${convertTimeTo24HourFormat(booking.time)}`);
        const notificationTime = bookingDate.getTime() - 3600000; // 1 hour before the session
        const currentTime = new Date();

        // Check if the booking is on the same day
        const isSameDay = bookingDate.toDateString() === currentTime.toDateString();

        if (isSameDay) {
            const timeUntilNotification = notificationTime - currentTime.getTime();

            // Schedule notification 1 hour before if it's on the same day and future
            if (timeUntilNotification > 0) {
                setTimeout(() => {
                    showNotification(`Same-day booking: ${booking.studentName} booked ${booking.facultyName} for ${booking.time}`, true);
                }, timeUntilNotification);
            } else {
                // If the session is within the next hour, notify immediately
                showNotification(`Urgent: ${booking.studentName} booked ${booking.facultyName} for ${booking.time} (within an hour)`, true);
            }
        } else {
            // For future bookings
            showNotification(`New booking: ${booking.studentName} booked ${booking.facultyName} for ${booking.date} at ${booking.time}`);
        }
    },

    addMessage(mentorId, message) {
        if (!this.messages[mentorId]) {
            this.messages[mentorId] = [];
        }
        this.messages[mentorId].push(message);
        this.saveMessages();
    }
};

// Load data from localStorage on page load
MentorshipData.loadBookings();
MentorshipData.loadMessages();

// Tab navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
        e.target.classList.add('active');

        const tabId = e.target.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');

        if (tabId === 'bookings') {
            loadBookings();
        }

        if (tabId === 'messages') {
            loadMessageMentorsList();
        }
    });
});

// Populate mentors section
const facultyGrid = document.querySelector('.faculty-grid');
MentorshipData.facultyData.forEach(faculty => {
    const card = document.createElement('div');
    card.classList.add('faculty-card');
    card.innerHTML = `
        <div class="faculty-info">
            <h3>${faculty.name}</h3>
            <p>${faculty.role}</p>
            <p>Qualification: ${faculty.qualification}</p>
            <p>Email: ${faculty.email}</p>
            <p>Phone: ${faculty.phone}</p>
            <p>Expertise: ${faculty.expertise.join(', ')}</p>
            <button class="btn btn-primary" data-id="${faculty.id}">Book a Session</button>
        </div>
    `;
    facultyGrid.appendChild(card);
});

// Booking modal
const bookingModal = document.getElementById('bookingModal');
const closeModal = document.querySelector('.close');
closeModal.addEventListener('click', () => {
    bookingModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === bookingModal) {
        bookingModal.style.display = 'none';
    }
});

// Open modal and load faculty time slots
facultyGrid.addEventListener('click', (e) => {
    const button = e.target.closest('button.btn-primary');
    if (button) {
        const facultyId = button.getAttribute('data-id');
        const faculty = MentorshipData.facultyData.find(f => f.id == facultyId);
        const timeSlotSelect = document.getElementById('time');
        timeSlotSelect.innerHTML = faculty.availableSlots.map(slot => `<option value="${slot}">${slot}</option>`).join('');
        bookingModal.style.display = 'block';

        document.getElementById('bookingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;
            const topic = document.getElementById('topic').value;

            const booking = {
                facultyId: facultyId,
                facultyName: faculty.name,
                date: date,
                time: time,
                topic: topic
            };

            MentorshipData.addBooking(booking);
            bookingModal.style.display = 'none';

            // Show booking confirmation
            showNotification('Booking confirmed!');

            // Update the bookings section immediately
            loadBookings();
        });
    }
});

// Load bookings into My Bookings section
function loadBookings() {
    const bookingsList = document.getElementById('bookingsList');
    bookingsList.innerHTML = '';

    MentorshipData.bookings.forEach(booking => {
        const bookingItem = document.createElement('div');
        bookingItem.classList.add('booking-card');
        bookingItem.innerHTML = `
            <p>Mentor: ${booking.facultyName}</p>
            <p>Date: ${booking.date}</p>
            <p>Time: ${booking.time}</p>
            <p>Topic: ${booking.topic}</p>
        `;
        bookingsList.appendChild(bookingItem);
    });
}

// Notification Center
let notificationCount = 0;
let notifications = [];

function showNotification(message, isUrgent = false) {
    notificationCount++;
    notifications.push({ message, isUrgent, timestamp: new Date().getTime() });
    updateNotificationCenter();

    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('visible');
    if (isUrgent) {
        notification.classList.add('urgent');
    }

    setTimeout(() => {
        notification.classList.remove('visible');
        notification.classList.remove('urgent');
    }, 5000);

    const storedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    storedNotifications.push({ message, isUrgent, timestamp: new Date().getTime() });
    localStorage.setItem('notifications', JSON.stringify(storedNotifications));
}

function checkStoredNotifications() {
    const storedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    storedNotifications.forEach(notif => {
        if (new Date().getTime() - notif.timestamp < 300000) { // Show notifications from the last 5 minutes
            showNotification(notif.message, notif.isUrgent);
        }
    });
    localStorage.setItem('notifications', JSON.stringify([]));
}

// Call this function when the page loads
window.addEventListener('load', checkStoredNotifications);

function updateNotificationCenter() {
    const notificationCounter = document.getElementById('notificationCounter');
    notificationCounter.textContent = notificationCount;
    notificationCounter.style.display = notificationCount > 0 ? 'block' : 'none';

    // Update the notification list in the Notifications tab
    const notificationList = document.getElementById('notificationList');
    notificationList.innerHTML = '';
    notifications.forEach((notif, index) => {
        const notifElement = document.createElement('div');
        notifElement.textContent = notif.message;
        notifElement.classList.add(notif.isUrgent ? 'urgent' : 'normal');
        notificationList.appendChild(notifElement);
    });

    // Update upcoming bookings
    updateUpcomingBookings();
}

function updateUpcomingBookings() {
    const upcomingBookings = document.getElementById('upcomingBookings');
    upcomingBookings.innerHTML = '';

    const sortedBookings = MentorshipData.bookings.sort((a, b) => new Date(a.date) - new Date(b.date));
    const futureBookings = sortedBookings.filter(booking => new Date(`${booking.date}T${convertTimeTo24HourFormat(booking.time)}`) > new Date());

    futureBookings.forEach(booking => {
        const bookingElement = document.createElement('div');
        bookingElement.innerHTML = `
            <p>You have a booking with ${booking.facultyName} on ${booking.date} at ${booking.time}</p>
        `;
        upcomingBookings.appendChild(bookingElement);
    });
}

// Notification Bell click event
document.getElementById('notificationBell').addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById('notifications').classList.add('active');
    updateNotificationCenter();
});


// Helper function to convert time format
function convertTimeTo24HourFormat(time) {
    const [hours, minutes] = time.split(' ')[0].split(':');
    const period = time.split(' ')[1];
    let hour = parseInt(hours);

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    return `${hour.toString().padStart(2, '0')}:${minutes}`;
}


// Load mentors list for messaging
function loadMessageMentorsList() {
    const messageMentorsList = document.getElementById('messageMentorsList');
    messageMentorsList.innerHTML = '';

    MentorshipData.facultyData.forEach(faculty => {
        const mentorItem = document.createElement('div');
        mentorItem.classList.add('mentor-item');
        mentorItem.textContent = faculty.name;
        mentorItem.dataset.id = faculty.id;
        mentorItem.addEventListener('click', (e) => {
            const mentorId = e.target.dataset.id;
            loadMessages(mentorId);
        });
        messageMentorsList.appendChild(mentorItem);
    });
}
document.addEventListener("DOMContentLoaded", function () {
    loadMessageMentorsList();
});
// Load messages for a selected mentor
function loadMessages(mentorId) {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';

    if (MentorshipData.messages[mentorId]) {
        MentorshipData.messages[mentorId].forEach(message => {
            const messageItem = document.createElement('div');
            messageItem.classList.add('message-item');
            messageItem.textContent = message;
            chatMessages.appendChild(messageItem);
        });
    }

    document.getElementById('sendMessage').onclick = () => {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value;
        if (message) {
            MentorshipData.addMessage(mentorId, message);
            messageInput.value = '';
            loadMessages(mentorId);
            simulateMentorResponse(mentorId);
        }
    };
}

// Simulate mentor response
function simulateMentorResponse(mentorId) {
    const responses = [
        "Thank you for your message. I'll get back to you shortly.",
        "Thanks for reaching out. I'll address this during our session."
    ];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    setTimeout(() => {
        MentorshipData.addMessage(mentorId, randomResponse);
        loadMessages(mentorId);
    }, 2000); // Simulate a 2-second delay for the mentor's response
}