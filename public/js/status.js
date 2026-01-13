export class StatusManager {
    constructor(statusDisplayElement) {
        this.statusDisplay = statusDisplayElement;
        this.steps = {
            plain: document.getElementById('stepPlain'),
            amp: document.getElementById('stepAmp'),
            integrations: document.getElementById('stepIntegrations')
        };
        
        this.originalTexts = {
            plain: 'Retrieving Plain thread...',
            amp: 'Analyzing with Deep Search...',
            integrations: 'Processing integrations...'
        };
    }
    
    show() {
        this.statusDisplay.style.display = 'block';
    }
    
    hide() {
        this.statusDisplay.style.display = 'none';
        this.reset();
    }
    
    reset() {
        Object.keys(this.steps).forEach(key => {
            this.updateStep(key, 'pending');
            const text = this.steps[key].querySelector('span');
            if (text) text.textContent = this.originalTexts[key];
        });
    }
    
    updateStep(stepKey, status, message = null) {
        const step = this.steps[stepKey];
        if (!step) return;
        
        const icon = step.querySelector('.icon');
        const text = step.querySelector('span');
        
        step.className = `status-step ${status}`;
        
        switch(status) {
            case 'running':
                icon.innerHTML = '<div class="spinner"></div>';
                break;
            case 'success':
                icon.innerHTML = '✅';
                if (message) text.textContent = message;
                break;
            case 'error':
                icon.innerHTML = '❌';
                if (message) text.textContent = message;
                break;
            case 'skipped':
                icon.innerHTML = '⏭️';
                step.className = 'status-step pending';
                break;
            default:
                icon.innerHTML = '⏳';
        }
    }
    
    setRunning() {
        this.updateStep('plain', 'running');
        this.updateStep('amp', 'running');
        this.updateStep('integrations', 'running');
    }
    
    setSuccess() {
        this.updateStep('plain', 'success', 'Plain thread retrieved successfully');
        this.updateStep('amp', 'success', 'Deep Search analysis completed');
        this.updateStep('integrations', 'success', 'Integrations processed');
    }
    
    setError(errorMsg) {
        if (errorMsg.includes('Plain') || errorMsg.includes('thread')) {
            this.updateStep('plain', 'error', `Plain error: ${errorMsg}`);
            this.updateStep('amp', 'error', 'Cancelled due to Plain failure');
            this.updateStep('integrations', 'error', 'Cancelled due to Plain failure');
        } else if (errorMsg.includes('Deep Search') || errorMsg.includes('Sourcegraph') || errorMsg.includes('AI')) {
            this.updateStep('plain', 'success', 'Plain thread retrieved successfully');
            this.updateStep('amp', 'error', `Deep Search error: ${errorMsg}`);
            this.updateStep('integrations', 'error', 'Cancelled due to AI failure');
        } else {
            this.updateStep('plain', 'success', 'Plain thread retrieved successfully');
            this.updateStep('amp', 'success', 'Deep Search analysis completed');
            this.updateStep('integrations', 'error', `Integration error: ${errorMsg}`);
        }
    }
    
    setNetworkError() {
        this.updateStep('plain', 'error', 'Network error occurred');
        this.updateStep('amp', 'error', 'Cancelled due to network error');
        this.updateStep('integrations', 'error', 'Cancelled due to network error');
    }
}
