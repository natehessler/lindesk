import { AlertManager } from './alert.js';

export class SettingsManager {
    constructor() {
        this.form = document.getElementById('settingsForm');
        this.loading = document.getElementById('loading');
        this.alertManager = new AlertManager(document.getElementById('alert'));
        
        this.init();
    }
    
    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.loadConfig();
    }
    
    async loadConfig() {
        try {
            this.showLoading(true);
            const response = await fetch('/api/config');
            const config = await response.json();
            
            this.populateForm(config);
            this.showLoading(false);
        } catch (error) {
            this.showLoading(false);
            this.alertManager.error('Failed to load configuration: ' + error.message);
        }
    }
    
    populateForm(config) {
        Object.keys(config).forEach(key => {
            const input = document.getElementById(key);
            if (!input) return;
            
            if (config[key] && config[key] !== '***') {
                input.value = config[key];
            } else if (config[key] === '***' && input.type === 'password') {
                input.placeholder = '••• Saved (leave blank to keep current value)';
                input.value = '';
            } else if (config[key] === '' && input.type !== 'password') {
                input.value = '';
            }
        });
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(this.form);
            const config = Object.fromEntries(formData.entries());
            
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.alertManager.success('Configuration saved successfully!');
            } else {
                this.alertManager.error(result.error || 'Failed to save configuration');
            }
        } catch (error) {
            this.alertManager.error('Failed to save configuration: ' + error.message);
        }
    }
    
    showLoading(show = true) {
        this.loading.style.display = show ? 'block' : 'none';
        this.form.style.display = show ? 'none' : 'block';
    }
}
