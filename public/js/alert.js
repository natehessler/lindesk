export class AlertManager {
    constructor(alertElement) {
        this.alert = alertElement;
    }
    
    show(message, type = 'success', duration = 5000) {
        this.alert.textContent = message;
        this.alert.className = `alert ${type}`;
        this.alert.style.display = 'block';
        
        if (duration > 0) {
            setTimeout(() => this.hide(), duration);
        }
    }
    
    hide() {
        this.alert.style.display = 'none';
    }
    
    success(message, duration) {
        this.show(message, 'success', duration);
    }
    
    error(message, duration) {
        this.show(message, 'error', duration);
    }
}
