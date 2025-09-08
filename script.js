// Global variables
let currentUser = null;
let isAdmin = false;
let currentSubject = null;

// Subject data storage
const API_BASE = (location.protocol === 'file:') ? 'http://localhost:8000' : '';
const subjects = {
    toc: { name: 'Theory of Computation', links: [] },
    ai: { name: 'Artificial Intelligence', links: [] },
    sepm: { name: 'Software Engineering Project Management', links: [] },
    cn: { name: 'Computer Networks', links: [] },
    rm: { name: 'Research Methodology', links: [] }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Load saved data from localStorage
    loadData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize visitor counter
    initializeVisitorCounter();
    
    // Show home page by default
    showHome();
});

// Set up event listeners
function setupEventListeners() {
    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Add link form submission
    document.getElementById('addLinkForm').addEventListener('submit', handleAddLink);
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const loginModal = document.getElementById('loginModal');
        const addLinkModal = document.getElementById('addLinkModal');
        
        if (event.target === loginModal) {
            closeLoginModal();
        }
        if (event.target === addLinkModal) {
            closeAddLinkModal();
        }
    });
}

// Authentication functions
function handleLogin(event) {
    event.preventDefault();
    
    const userName = document.getElementById('userName').value.trim();
    let userNumber = document.getElementById('userNumber').value.trim();
    userNumber = userNumber.replace(/\D/g, '').slice(0, 10);

    
    if (!userName || !userNumber) {
        alert('Please fill in all fields');
        return;
    }
    
    // Check if admin credentials
    if (userName.toLowerCase() === 'admin' && userNumber === '1234567') {
        currentUser = { name: userName, number: userNumber };
        isAdmin = true;
        showMessage('Welcome Admin! You have administrative privileges.', 'success');
    } else {
        currentUser = { name: userName, number: userNumber };
        isAdmin = false;
        showMessage(`Welcome ${userName}! You are logged in as a student.`, 'success');
    }
    
    // Update UI for logged in state
    updateUIForLoggedInUser();
    
    // Close login modal
    closeLoginModal();
    
    // Clear form
    document.getElementById('loginForm').reset();
}

function logout() {
    currentUser = null;
    isAdmin = false;
    currentSubject = null;
    
    // Update UI for logged out state
    updateUIForLoggedOutUser();
    
    // Show home page
    showHome();
    
    showMessage('You have been logged out successfully.', 'info');
}

// UI Update functions
function updateUIForLoggedInUser() {
    // Show logout button and hide login button
    document.getElementById('logoutBtn').style.display = 'block';
    document.getElementById('loginBtn').style.display = 'none';
    
    // Show add link buttons for admin
    if (isAdmin) {
        const addButtons = document.querySelectorAll('.add-link-btn');
        addButtons.forEach(btn => btn.style.display = 'block');
    }
}

function updateUIForLoggedOutUser() {
    // Hide logout button and show login button
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('loginBtn').style.display = 'block';
    
    // Hide add link buttons
    const addButtons = document.querySelectorAll('.add-link-btn');
    addButtons.forEach(btn => btn.style.display = 'none');
}

// Navigation functions
function showHome() {
    hideAllPages();
    document.getElementById('homePage').classList.add('active');
    closeDropdown();
}

function showSubject(subjectKey) {
    // Check if user is logged in
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    hideAllPages();
    currentSubject = subjectKey;
    
    const pageId = subjectKey + 'Page';
    document.getElementById(pageId).classList.add('active');
    
    // Update the page content
    updateSubjectPage(subjectKey);
    
    closeDropdown();
}

function showNextSubject(currentSubjectKey) {
    // Check if user is logged in
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    // Define the order of subjects
    const subjectOrder = ['toc', 'ai', 'sepm', 'cn', 'rm'];
    const currentIndex = subjectOrder.indexOf(currentSubjectKey);
    
    // Determine next subject (cycle back to first if at last)
    let nextIndex = (currentIndex + 1) % subjectOrder.length;
    const nextSubjectKey = subjectOrder[nextIndex];
    
    // Navigate to next subject
    showSubject(nextSubjectKey);
}

function showPreviousSubject(currentSubjectKey) {
    // Check if user is logged in
    if (!currentUser) {
        showLoginModal();
        return;
    }
    const subjectOrder = ['toc', 'ai', 'sepm', 'cn', 'rm'];
    const currentIndex = subjectOrder.indexOf(currentSubjectKey);
    // Determine previous subject (cycle to last if at first)
    let prevIndex = (currentIndex - 1 + subjectOrder.length) % subjectOrder.length;
    const prevSubjectKey = subjectOrder[prevIndex];
    showSubject(prevSubjectKey);
}

function hideAllPages() {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
}

function updateSubjectPage(subjectKey) {
    const subject = subjects[subjectKey];
    const linksContainer = document.getElementById(subjectKey + 'Links');
    
    // Clear existing links
    linksContainer.innerHTML = '';
    
    if (subject.links.length === 0) {
        linksContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No links available for this subject.</p>';
        return;
    }
    
    // Display links
    subject.links.forEach((link, index) => {
        const linkElement = createLinkElement(link, subjectKey, index);
        linksContainer.appendChild(linkElement);
    });
}

function createLinkElement(link, subjectKey, index) {
    const linkDiv = document.createElement('div');
    linkDiv.className = 'link-item';
    
    const linkAnchor = document.createElement('a');
    linkAnchor.href = link.url;
    linkAnchor.target = '_blank';
    linkAnchor.rel = 'noopener noreferrer';
    linkAnchor.textContent = link.title;
    
    linkDiv.appendChild(linkAnchor);
    
    // Add delete button for admin
    if (isAdmin) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteLink(subjectKey, link._id || index);
        linkDiv.appendChild(deleteBtn);
    }
    
    return linkDiv;
}

// Dropdown functions
function toggleDropdown() {
    const dropdown = document.getElementById('dropdownContent');
    dropdown.classList.toggle('show');
}

function closeDropdown() {
    const dropdown = document.getElementById('dropdownContent');
    dropdown.classList.remove('show');
}

// Modal functions
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.getElementById('userName').focus();
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginForm').reset();
}

function showAddLinkModal(subjectKey) {
    if (!isAdmin) {
        showMessage('Only administrators can add links.', 'error');
        return;
    }
    
    currentSubject = subjectKey;
    document.getElementById('addLinkModal').style.display = 'block';
    document.getElementById('linkTitle').focus();
}

function closeAddLinkModal() {
    document.getElementById('addLinkModal').style.display = 'none';
    document.getElementById('addLinkForm').reset();
    currentSubject = null;
}

// Link management functions
function handleAddLink(event) {
    event.preventDefault();
    
    const title = document.getElementById('linkTitle').value.trim();
    const url = document.getElementById('linkUrl').value.trim();
    
    if (!title || !url) {
        alert('Please fill in all fields');
        return;
    }
    
    // Validate URL
    try {
        new URL(url);
    } catch (e) {
        alert('Please enter a valid URL');
        return;
    }
    
    // Add link via backend API
    const payload = { title, url, addedBy: currentUser.name };
    fetch(`${API_BASE}/api/subjects/${currentSubject}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(async (res) => {
            if (!res.ok) throw new Error('Failed to add link');
            const created = await res.json();
            const res2 = await fetch(`${API_BASE}/api/subjects/${currentSubject}/links`);
            if (!res2.ok) throw new Error('Failed to reload links');
            const latest = await res2.json();
            subjects[currentSubject].links = latest;
            updateSubjectPage(currentSubject);
            closeAddLinkModal();
            showMessage('Link added successfully!', 'success');
        })
        .catch((err) => {
            console.error(err);
            showMessage('Error adding link. Please try again.', 'error');
        });
}

function deleteLink(subjectKey, idOrIndex) {
    if (!isAdmin) {
        showMessage('Only administrators can delete links.', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to delete this link?')) {
        fetch(`${API_BASE}/api/subjects/${subjectKey}/links/${idOrIndex}`, { method: 'DELETE' })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to delete link');
                return fetch(`${API_BASE}/api/subjects/${subjectKey}/links`);
            })
            .then(async (res) => {
                if (!res.ok) throw new Error('Failed to reload links');
                const links = await res.json();
                subjects[subjectKey].links = links;
                updateSubjectPage(subjectKey);
                showMessage('Link deleted successfully!', 'success');
            })
            .catch((err) => {
                console.error(err);
                showMessage('Error deleting link. Please try again.', 'error');
            });
    }
}

// Data persistence functions (backend API)
function saveData() {
    // No-op: state is sourced from backend
}

async function loadData() {
    try {
        const res = await fetch(`${API_BASE}/api/subjects`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        Object.keys(subjects).forEach((key) => {
            subjects[key].links = (data[key] && data[key].links) ? data[key].links : [];
        });
    } catch (e) {
        console.error('Error loading data from server:', e);
    }
}

// Utility functions
function showMessage(message, type = 'info') {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 3000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            messageDiv.style.backgroundColor = '#28a745';
            break;
        case 'error':
            messageDiv.style.backgroundColor = '#dc3545';
            break;
        case 'warning':
            messageDiv.style.backgroundColor = '#ffc107';
            messageDiv.style.color = '#333';
            break;
        default:
            messageDiv.style.backgroundColor = '#17a2b8';
    }
    
    messageDiv.textContent = message;
    
    // Add to page
    document.body.appendChild(messageDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Prevent access to subject pages without login
function checkAuthentication() {
    if (!currentUser) {
        showLoginModal();
        return false;
    }
    return true;
}

// Initialize with some sample data if none exists
function initializeSampleData() {
    // No longer seeding local data; backend persists links
}

// Visitor counter functionality
function initializeVisitorCounter() {
    // Check if this is a new visitor
    const lastVisit = localStorage.getItem('lastVisit');
    const currentDate = new Date().toDateString();
    
    if (lastVisit !== currentDate) {
        // New day, increment visitor count
        incrementVisitorCount();
        localStorage.setItem('lastVisit', currentDate);
    }
    
    // Update the display
    updateVisitorDisplay();
}

function incrementVisitorCount() {
    let visitorCount = parseInt(localStorage.getItem('visitorCount') || '0');
    visitorCount++;
    localStorage.setItem('visitorCount', visitorCount.toString());
}

function updateVisitorDisplay() {
    const visitorCount = localStorage.getItem('visitorCount') || '0';
    const visitorElement = document.getElementById('visitorCount');
    if (visitorElement) {
        visitorElement.textContent = visitorCount;
        
        // Add animation effect
        visitorElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            visitorElement.style.transform = 'scale(1)';
        }, 200);
    }
}

// Initialize sample data on first load
document.addEventListener('DOMContentLoaded', function() {
    initializeSampleData();
});
