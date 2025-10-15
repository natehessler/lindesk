import { ThemeManager } from './theme.js';
import { TicketAnalyzer } from './ticket-analyzer.js';

document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    new TicketAnalyzer();
});
