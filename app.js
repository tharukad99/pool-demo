// --- MOCK DATABASE ---
const INITIAL_TABLES = [
    { id: 1, name: "Table 1", price: 15, status: "available" },
    { id: 2, name: "Table 2", price: 18, status: "busy" },
    { id: 3, name: "Table 3", price: 15, status: "available" },
    { id: 4, name: "Table 4", price: 20, status: "available" },
    { id: 5, name: "Table 5", price: 15, status: "busy" }
];

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let tables = JSON.parse(localStorage.getItem('tables')) || INITIAL_TABLES;
let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
let currentBookingTableId = null;
let selectedDate = null;
let selectedTime = null;

// --- INITIALIZATION ---
window.onload = () => {
    updateAuthUI();
    renderTables();
    renderBookings();
    updatePointsUI();
    
    // Smooth scroll and SPA logic
    updateActiveLink('home');
    
    // Set images
    const hero = document.getElementById('hero-bg');
    hero.style.backgroundImage = `linear-gradient(rgba(13, 13, 17, 0.7), rgba(13, 13, 17, 0.9)), url('pool_hall_hero_1775213388707.png')`;
    
    const aboutImg = document.getElementById('about-img-container');
    if(aboutImg) aboutImg.style.backgroundImage = `url('about_pool_lounge_1775471711301.png')`;
};

// ... existing navigation UI helpers ...
function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    updateActiveLink(id);
    
    if(id === 'account') {
        if(!currentUser) {
            showSection('login');
            showToast('Please login to view profile');
            return;
        }
        renderBookings();
    }
}

function updateActiveLink(id) {
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    const link = document.getElementById(`nav-${id}`);
    if(link) link.classList.add('active');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function updateAuthUI() {
    const container = document.getElementById('auth-controls');
    if(currentUser) {
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="color: var(--text-dim); font-size: 0.9rem;">Welcome, <b>${currentUser.username}</b></span>
                <button class="btn btn-outline" onclick="showSection('account')" style="padding: 10px 20px;">My Profile</button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <button class="btn btn-outline" onclick="showSection('login')">Sign In</button>
            <button class="btn btn-primary" onclick="showSection('register')">Join Now</button>
        `;
    }
}

function updatePointsUI() {
    const pointsSpan = document.getElementById('user-points');
    const playerPointsSmall = document.getElementById('player-points-small');
    const progress = document.getElementById('point-progress');
    const playerName = document.getElementById('player-name');
    
    if(currentUser) {
        pointsSpan.innerText = currentUser.points;
        if(playerPointsSmall) playerPointsSmall.innerText = `${currentUser.points} pts`;
        if(playerName) playerName.innerText = currentUser.name.split(' ')[0];
        let percent = (currentUser.points / 500) * 100;
        if(percent > 100) percent = 100;
        progress.style.width = `${percent}%`;
    } else {
        pointsSpan.innerText = "0";
    }
}

// ... existing auth forms ...
document.getElementById('login-form').onsubmit = (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === username);
    if(user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateAuthUI();
        updatePointsUI();
        showSection('home');
        showToast(`Welcome back, ${user.name}!`);
    } else {
        showToast("User not found.");
    }
};

document.getElementById('register-form').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const username = document.getElementById('reg-username').value;
    const newUser = { name, username, points: 100, bookingsCount: 0 };
    let users = JSON.parse(localStorage.getItem('users')) || [];
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateAuthUI();
    updatePointsUI();
    showSection('home');
    showToast("Registration successful! 100 pts added.");
};

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthUI();
    updatePointsUI();
    showSection('home');
    showToast("Successfully logged out.");
}

// --- UPDATED TABLE & BOOKING LOGIC ---
function renderTables() {
    const grid = document.getElementById('tables-grid');
    grid.innerHTML = '';
    tables.forEach(t => {
        const card = document.createElement('div');
        card.className = 'table-card';
        const badgeClass = t.status === 'available' ? 'status-available' : 'status-busy';
        card.innerHTML = `
            <h3>${t.name} <span class="status-badge ${badgeClass}">${t.status}</span></h3>
            <div class="table-visual">
                <svg viewBox="0 0 100 60" class="pool-table-svg">
                    <rect x="5" y="5" width="90" height="50" rx="3" fill="#2c3e50" stroke="#7f8c8d" stroke-width="1.5"/>
                    <rect x="8" y="8" width="84" height="44" rx="2" fill="${t.status === 'available' ? '#27ae60' : '#c0392b'}" />
                    <circle cx="8" cy="8" r="3" fill="#000" /><circle cx="50" cy="8" r="3" fill="#000" /><circle cx="92" cy="8" r="3" fill="#000" />
                    <circle cx="8" cy="52" r="3" fill="#000" /><circle cx="50" cy="52" r="3" fill="#000" /><circle cx="92" cy="52" r="3" fill="#000" />
                </svg>
            </div>
            <div class="table-info">
                <p><b>Price:</b> $${t.price}/hr</p>
                <p><b>Spec:</b> Professional Black Felt</p>
            </div>
            <button class="btn btn-primary" style="width: 100%;" onclick="openBookingModal(${t.id})">
                Check Availability
            </button>
        `;
        grid.appendChild(card);
    });
}

function openBookingModal(id) {
    if(!currentUser) {
        showSection('login');
        showToast('Login required to book tables');
        return;
    }
    
    currentBookingTableId = id;
    selectedDate = null;
    selectedTime = null;
    
    const table = tables.find(t => t.id === id);
    document.getElementById('booking-modal').style.display = 'flex';
    
    const details = document.getElementById('modal-details');
    details.innerHTML = `
        <h3 style="color: var(--primary); margin-bottom: 5px;">${table.name}</h3>
        <p style="font-size: 0.9rem; color: var(--text-dim);">Rate: <b>$${table.price}/hr</b></p>
    `;

    populateDates();
    document.getElementById('time-grid').innerHTML = '<p style="color: var(--text-dim); font-size: 0.8rem; padding: 10px;">Please select a date first.</p>';
}

function populateDates() {
    const grid = document.getElementById('date-grid');
    grid.innerHTML = '';
    
    const today = new Date();
    for(let i=0; i<30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        
        const item = document.createElement('div');
        item.className = 'selection-item';
        item.innerHTML = `<div>${month}</div><div style="font-weight: 800; font-size: 1.1rem;">${day}</div>`;
        item.onclick = () => selectDate(date.toISOString().split('T')[0], item);
        grid.appendChild(item);
    }
}

function selectDate(dateStr, element) {
    selectedDate = dateStr;
    document.querySelectorAll('#date-grid .selection-item').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    
    populateTimes();
}

function populateTimes() {
    const grid = document.getElementById('time-grid');
    grid.innerHTML = '';
    
    const slots = [
        "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", 
        "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", 
        "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM"
    ];

    slots.forEach(slot => {
        const isBusy = (Math.random() < 0.2); // Random mock busy slots
        const item = document.createElement('div');
        item.className = `selection-item ${isBusy ? 'disabled' : ''}`;
        item.innerText = slot;
        
        if(!isBusy) {
            item.onclick = () => {
                selectedTime = slot;
                document.querySelectorAll('#time-grid .selection-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
            };
        } else {
            item.title = "Already booked";
        }
        grid.appendChild(item);
    });
}

function closeModal() {
    document.getElementById('booking-modal').style.display = 'none';
}

function confirmBooking() {
    if(!selectedDate || !selectedTime) {
        showToast("Please select both date and time.");
        return;
    }

    const table = tables.find(t => t.id === currentBookingTableId);
    
    // In a real app, we'd update specific slot status. 
    // For demo, we just add to history and update points.
    
    currentUser.points += 50;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    const newBooking = {
        id: Date.now(),
        user: currentUser.username,
        tableName: table.name,
        price: table.price,
        points: 50,
        time: `${selectedDate} at ${selectedTime}`,
        status: 'Confirmed'
    };
    
    bookings.unshift(newBooking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    closeModal();
    updatePointsUI();
    showToast("Booking successful! +50 pts");
}

function renderBookings() {
    const tbody = document.getElementById('bookings-tbody');
    const noBookings = document.getElementById('no-bookings');
    if(!tbody) return;
    const userBookings = bookings.filter(b => b.user === currentUser?.username);
    tbody.innerHTML = '';
    if(userBookings.length === 0) {
        noBookings.style.display = 'block';
    } else {
        noBookings.style.display = 'none';
        userBookings.forEach(b => {
            const row = document.createElement('tr');
            row.className = 'booking-row';
            row.innerHTML = `
                <td><b>${b.tableName}</b></td>
                <td style="font-size: 0.85rem;">${b.time}</td>
                <td><span style="color: var(--primary);">+${b.points} pts</span></td>
                <td><span class="status-badge status-available">${b.status}</span></td>
            `;
            tbody.appendChild(row);
        });
    }
}

