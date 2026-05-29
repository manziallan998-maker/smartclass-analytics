// ==================== MAIN APPLICATION ====================

// Import all modules
// (In practice, these would be included via script tags in order)

// Sidebar Manager
class SidebarManager {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.mainContent = document.querySelector('.main-content');
        this.menuToggle = document.getElementById('menuToggle');
        this.closeBtn = document.getElementById('closeSidebar');
        this.setupEvents();
    }

    setupEvents() {
        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', () => this.toggle());
        }
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
    }

    toggle() {
        if (window.innerWidth <= 768) {
            this.sidebar.classList.toggle('open');
        } else {
            this.sidebar.classList.toggle('collapsed');
            this.mainContent.classList.toggle('expanded');
        }
    }

    close() {
        if (window.innerWidth <= 768) {
            this.sidebar.classList.remove('open');
        } else {
            this.sidebar.classList.add('collapsed');
            this.mainContent.classList.add('expanded');
        }
    }
}

// Notification Manager
class NotificationManager {
    constructor() {
        this.dropdown = document.getElementById('notificationsDropdown');
        this.btn = document.getElementById('notificationsBtn');
        this.badge = document.getElementById('notificationBadge');
        this.setupEvents();
        this.loadNotifications();
    }

    setupEvents() {
        if (this.btn) {
            this.btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }

        document.addEventListener('click', () => {
            if (this.dropdown) {
                this.dropdown.classList.remove('show');
            }
        });

        if (this.dropdown) {
            this.dropdown.addEventListener('click', (e) => e.stopPropagation());
        }
    }

    toggleDropdown() {
        if (this.dropdown) {
            this.dropdown.classList.toggle('show');
        }
    }

    loadNotifications() {
        // Demo notifications
        const notifications = [
            { id: 1, title: 'Today\'s schedule: Physics S4A at 08:00', time: '2 hours ago', isNew: true, icon: 'fa-chalkboard' },
            { id: 2, title: 'Physics S3B has 8 failing students', time: '5 hours ago', isNew: true, icon: 'fa-exclamation-triangle' },
            { id: 3, title: 'UWAMAHORO Eric is top performer', time: 'Yesterday', isNew: false, icon: 'fa-chart-line' }
        ];
        
        this.renderNotifications(notifications);
        this.updateBadge(notifications.filter(n => n.isNew).length);
    }

    renderNotifications(notifications) {
        const container = document.querySelector('.notifications-list');
        if (!container) return;
        
        container.innerHTML = notifications.map(n => `
            <div class="notification ${n.isNew ? 'new' : ''}">
                <i class="fas ${n.icon}"></i>
                <div class="content">
                    <p>${n.title}</p>
                    <span class="time">${n.time}</span>
                </div>
            </div>
        `).join('');
    }

    updateBadge(count) {
        if (this.badge) {
            this.badge.textContent = count;
            this.badge.style.display = count > 0 ? 'inline' : 'none';
        }
    }
}

// Dashboard Class Manager
class DashboardManager {
    constructor() {
        this.loadDashboardData();
    }

    loadDashboardData() {
        const classes = storage.getClasses();
        const students = storage.getStudents();
        
        // Update stats
        const totalStudents = students.length;
        const totalClasses = classes.length;
        const passingRate = Math.round((students.filter(s => (s.term3 || 0) >= 50).length / totalStudents) * 100) || 0;
        const needsAttention = students.filter(s => (s.term3 || 0) < 50).length;
        
        document.getElementById('totalStudents').textContent = totalStudents;
        document.getElementById('totalClasses').textContent = totalClasses;
        document.getElementById('passingRate').textContent = passingRate + '%';
        document.getElementById('needsAttention').textContent = needsAttention;
        
        this.renderPerformanceList(classes);
    }

    renderPerformanceList(classes) {
        const container = document.getElementById('performanceList');
        if (!container) return;
        
        container.innerHTML = classes.map(cls => {
            const avg = cls.average || 0;
            const trend = avg > 65 ? 'up' : (avg < 60 ? 'down' : '');
            const trendValue = trend === 'up' ? '+5%' : (trend === 'down' ? '-2%' : '+0%');
            
            return `
                <div class="performance-item">
                    <div class="class-info">
                        <span class="class-name">${cls.name}</span>
                        <span class="student-count">${cls.studentCount || 0} students</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${avg}%; background: ${this.getProgressColor(avg)};"></div>
                    </div>
                    <div class="class-stats">
                        <span class="percentage">${avg}%</span>
                        <span class="trend ${trend}">${trend === 'up' ? '↑' : (trend === 'down' ? '↓' : '→')} ${trendValue}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    getProgressColor(percentage) {
        if (percentage >= 80) return '#10B981';
        if (percentage >= 60) return '#FF6600';
        if (percentage >= 50) return '#F59E0B';
        return '#EF4444';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new SidebarManager();
    new NotificationManager();
    
    if (document.getElementById('performanceList')) {
        new DashboardManager();
    }
    
    // Update teacher name in sidebar
    const user = auth.getUser();
    if (user) {
        document.querySelectorAll('#teacherName, .teacher-name, .name').forEach(el => {
            if (el) el.textContent = user.name;
        });
        document.querySelectorAll('#teacherEmail, .teacher-email, .email').forEach(el => {
            if (el) el.textContent = user.email;
        });
    }
    
    // Setup logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => auth.logout());
    }
});
