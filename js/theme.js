// ==================== THEME MANAGEMENT ====================
// This file handles global theme settings that affect ALL pages

class ThemeManager {
    constructor() {
        this.loadSettings();
        this.applyTheme();
        this.setupListeners();
    }

    loadSettings() {
        // Load from localStorage
        this.settings = {
            backgroundColor: localStorage.getItem('bgColor') || '#000000',
            textColor: localStorage.getItem('textColor') || '#FFFFFF',
            accentColor: localStorage.getItem('accentColor') || '#FF6600',
            darkMode: localStorage.getItem('darkMode') !== 'false'
        };
    }

    saveSettings() {
        localStorage.setItem('bgColor', this.settings.backgroundColor);
        localStorage.setItem('textColor', this.settings.textColor);
        localStorage.setItem('accentColor', this.settings.accentColor);
        localStorage.setItem('darkMode', this.settings.darkMode);
    }

    applyTheme() {
        // Apply background color
        document.body.style.backgroundColor = this.settings.backgroundColor;
        
        // Apply text color
        document.body.style.color = this.settings.textColor;
        
        // Apply accent color to CSS variables
        document.documentElement.style.setProperty('--accent-primary', this.settings.accentColor);
        
        // Apply dark/light mode class
        if (!this.settings.darkMode) {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
        
        // Update all elements that use accent color
        this.updateAccentElements();
    }

    updateAccentElements() {
        // Update buttons with btn-primary class
        document.querySelectorAll('.btn-primary, .btn, button[class*="accent"]').forEach(btn => {
            if (btn.style.background !== 'none') {
                btn.style.background = `linear-gradient(135deg, ${this.settings.accentColor}, ${this.lightenColor(this.settings.accentColor, 20)})`;
            }
        });
        
        // Update accent-colored text
        document.querySelectorAll('.accent-text, .logo, .nav-item.active').forEach(el => {
            el.style.color = this.settings.accentColor;
        });
    }

    lightenColor(color, percent) {
        // Simple color lightening - for gradient effect
        if (color.startsWith('#')) {
            const num = parseInt(color.slice(1), 16);
            const r = Math.min(255, (num >> 16) + percent);
            const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
            const b = Math.min(255, (num & 0x0000FF) + percent);
            return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
        }
        return color;
    }

    updateSetting(setting, value) {
        if (setting === 'backgroundColor') {
            this.settings.backgroundColor = value;
            document.body.style.backgroundColor = value;
        } else if (setting === 'textColor') {
            this.settings.textColor = value;
            document.body.style.color = value;
        } else if (setting === 'accentColor') {
            this.settings.accentColor = value;
            document.documentElement.style.setProperty('--accent-primary', value);
            this.updateAccentElements();
        } else if (setting === 'darkMode') {
            this.settings.darkMode = value;
            if (!value) {
                document.body.classList.add('light-theme');
            } else {
                document.body.classList.remove('light-theme');
            }
        }
        
        this.saveSettings();
        
        // Dispatch event for other pages to listen
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: this.settings }));
    }

    getSettings() {
        return { ...this.settings };
    }

    setupListeners() {
        // Listen for theme change events from settings page
        window.addEventListener('themeChanged', (e) => {
            this.settings = e.detail;
            this.applyTheme();
        });
    }
}

// Initialize theme on page load
const themeManager = new ThemeManager();

// Make available globally
window.themeManager = themeManager;
