// Main Entry Point for Webview
// 
// This is the entry point that gets bundled and loaded in the webview

import { WorkbenchRuntime } from './WorkbenchRuntime';

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

function initialize() {
    try {
        console.log('[Workbench] Starting initialization...');

        // Get configuration injected by the extension
        const config = window.__workbenchConfig;

        if (!config) {
            throw new Error('Workbench configuration not found');
        }

        // Create and initialize the workbench runtime
        const runtime = new WorkbenchRuntime(config);
        runtime.initialize().catch(error => {
            console.error('[Workbench] Initialization error:', error);
            const canvas = document.getElementById('canvas');
            if (canvas) {
                canvas.innerHTML = `
                    <div class="error-message">
                        <strong>Initialization Error:</strong> ${error.message || error}
                    </div>
                    <p style="padding: 16px;">
                        Check the browser console for more details.
                        Click the Developer Tools button (⚙) in the toolbar to open DevTools.
                    </p>
                `;
            }
        });

    } catch (globalError: any) {
        console.error('[Workbench] Fatal initialization error:', globalError);
        const canvas = document.getElementById('canvas');
        if (canvas) {
            canvas.innerHTML = `
                <div class="error-message">
                    <strong>Fatal Error:</strong> ${globalError.message || globalError}
                </div>
                <p style="padding: 16px;">
                    The workbench failed to initialize. Please check the console for details.
                </p>
            `;
        }
    }
}
