import { ThemeManager } from './theme.js';
import { SettingsManager } from './settings-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    new SettingsManager();
});
