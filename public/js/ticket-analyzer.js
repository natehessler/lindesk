import { AlertManager } from './alert.js';
import { StatusManager } from './status.js';
import { MarkdownRenderer } from './markdown.js';

export class TicketAnalyzer {
    constructor() {
        this.form = document.getElementById('analysisForm');
        this.results = document.getElementById('results');
        this.resultsContent = document.getElementById('resultsContent');
        this.emptyState = document.getElementById('emptyState');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        
        this.alertManager = new AlertManager(document.getElementById('alert'));
        this.statusManager = new StatusManager(document.getElementById('statusDisplay'));
        
        this.init();
    }
    
    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = this.getFormData();
        
        if (!formData.ticketId) {
            this.alertManager.error('Please enter a ticket ID');
            return;
        }

        try {
            this.setLoadingState(true);
            this.statusManager.show();
            this.statusManager.setRunning();
            this.hideResults();
            
            const result = await this.analyzeTicket(formData);
            
            if (result.success) {
                this.handleSuccess(result);
            } else {
                this.handleError(result.error);
            }
        } catch (error) {
            this.handleNetworkError(error);
        } finally {
            this.setLoadingState(false);
        }
    }
    
    getFormData() {
        return {
            ticketId: document.getElementById('ticketId').value,
            customPrompt: document.getElementById('customPrompt').value || undefined,
            slackChannel: document.getElementById('slackChannel').value || undefined,
            linearProject: document.getElementById('linearProject').value || undefined
        };
    }
    
    async analyzeTicket(data) {
        const response = await fetch('/api/analyze-ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        return await response.json();
    }
    
    handleSuccess(result) {
        this.statusManager.setSuccess();
        
        const analysis = result.result.analysis;
        let displayText = '';
        
        if (analysis) {
            if (analysis.title) {
                displayText += `# ${analysis.title}\n\n`;
            }
            if (analysis.description) {
                displayText += analysis.description;
            }
        } else {
            displayText = JSON.stringify(result.result, null, 2);
        }
        
        const htmlContent = MarkdownRenderer.toHTML(displayText);
        this.resultsContent.innerHTML = htmlContent;
        this.showResults();
        this.statusManager.hide();
        this.alertManager.success('Ticket analysis completed successfully!');
    }
    
    handleError(errorMsg) {
        const message = errorMsg || 'Failed to analyze ticket';
        this.statusManager.setError(message);
        this.alertManager.error(message);
    }
    
    handleNetworkError(error) {
        this.statusManager.setNetworkError();
        this.alertManager.error('Analysis failed: ' + error.message);
    }
    
    setLoadingState(loading) {
        this.analyzeBtn.classList.toggle('loading', loading);
        this.analyzeBtn.disabled = loading;
        this.analyzeBtn.textContent = loading ? '' : 'Analyze Ticket';
    }
    
    showResults() {
        this.results.style.display = 'block';
        this.emptyState.style.display = 'none';
    }
    
    hideResults() {
        this.results.style.display = 'none';
        this.emptyState.style.display = 'block';
    }
}
