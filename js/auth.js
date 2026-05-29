// ==================== AUTHENTICATION MANAGEMENT ====================

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('teacherToken');
        this.user = null;
        if (this.token) {
            this.decodeToken();
        }
    }

    decodeToken() {
        try {
            const payload = JSON.parse(atob(this.token.split('.')[0]));
            this.user = {
                name: payload.name,
                email: payload.email,
                teacherId: payload.teacher_id
            };
        } catch (e) {
            this.logout();
        }
    }

    isAuthenticated() {
        return !!this.token;
    }

    getUser() {
        return this.user;
    }

    getToken() {
        return this.token;
    }

    setToken(token, userData) {
        this.token = token;
        this.user = userData;
        localStorage.setItem('teacherToken', token);
        localStorage.setItem('teacherName', userData.name);
        localStorage.setItem('teacherEmail', userData.email);
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('teacherToken');
        localStorage.removeItem('teacherName');
        localStorage.removeItem('teacherEmail');
        window.location.href = 'index.html';
    }

    // For demo/offline mode - create a demo token
    createDemoToken() {
        const demoUser = {
            name: 'Mr. Jean UWIMANA',
            email: 'teacher@school.rw',
            teacher_id: 'TCH_DEMO_001'
        };
        const token = btoa(JSON.stringify(demoUser)) + '.demo';
        this.setToken(token, demoUser);
        return true;
    }
}

const auth = new AuthManager();
window.auth = auth;

// Protect pages - redirect to login if not authenticated
function requireAuth() {
    if (!auth.isAuthenticated() && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
    requireAuth();
    
    // Update teacher name in sidebar
    const user = auth.getUser();
    if (user) {
        document.querySelectorAll('#teacherName, .teacher-name').forEach(el => {
            if (el) el.textContent = user.name;
        });
        document.querySelectorAll('#teacherEmail, .teacher-email').forEach(el => {
            if (el) el.textContent = user.email;
        });
    }
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => auth.logout());
    }
});
