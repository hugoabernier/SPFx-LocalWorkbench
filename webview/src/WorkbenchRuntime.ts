// Workbench Runtime
// 
// Main runtime class that manages the SPFx local workbench

import type { IWorkbenchConfig, IWebPartManifest, IActiveWebPart, IVsCodeApi } from './types';
import type { IAppHandlers } from './components/App';
import { AmdLoader } from './amd/AmdLoader';
import { SpfxContext } from './mocks/SpfxContext';
import { ThemeProvider } from './mocks/ThemeProvider';
import { WebPartManager } from './WebPartManager';

export class WorkbenchRuntime {
    private vscode: IVsCodeApi;
    private config: IWorkbenchConfig;
    private amdLoader: AmdLoader;
    private contextProvider: SpfxContext;
    private themeProvider: ThemeProvider;
    private webPartManager: WebPartManager;
    private appHandlers: IAppHandlers | null = null;
    
    private loadedManifests: IWebPartManifest[] = [];
    private activeWebParts: IActiveWebPart[] = [];

    constructor(config: IWorkbenchConfig) {
        this.vscode = window.acquireVsCodeApi();
        this.config = config;

        // Initialize core components
        this.amdLoader = new AmdLoader();
        this.contextProvider = new SpfxContext(config.context, config.pageContext);
        this.themeProvider = new ThemeProvider(config.theme);
        this.webPartManager = new WebPartManager(
            this.vscode,
            config.serveUrl,
            this.contextProvider,
            this.themeProvider,
            config.verboseLogging || false
        );

        // Setup event listeners after a short delay to ensure DOM is ready
        setTimeout(() => this.setupEventListeners(), 100);

        // Expose to window for debugging
        (window as any).__workbench = this;
    }

    setAppHandlers(handlers: IAppHandlers): void {
        this.appHandlers = handlers;
    }

    async initialize(): Promise<void> {
        try {
            
            // Initialize AMD loader
            this.amdLoader.initialize();

            // Update status
            this.updateStatus('Connecting to serve at ' + this.config.serveUrl + '...');

            // Load manifests from serve
            await this.loadManifests();

            this.updateStatus('Connected');
            this.updateConnectionStatus(true);
            
            const webPartCount = this.loadedManifests.filter(m => m.componentType === 'WebPart').length;
            this.updateWebPartCount(webPartCount);

            // Update React app
            if (this.appHandlers) {
                this.appHandlers.setManifests(this.loadedManifests);
                this.appHandlers.setActiveWebParts(this.activeWebParts);
            }

        } catch (error: any) {
            this.updateConnectionStatus(false);
            // Error will be displayed by React component
        }
    }

    private async loadManifests(): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = this.config.serveUrl + '/temp/build/manifests.js';
            script.onload = () => {
                if (window.debugManifests?.getManifests) {
                    this.loadedManifests = window.debugManifests.getManifests();
                    this.updateStatus('Loaded ' + this.loadedManifests.length + ' web parts');

                    // Update internal module base URLs
                    this.loadedManifests.forEach(m => {
                        if (m.loaderConfig?.internalModuleBaseUrls) {
                            m.loaderConfig.internalModuleBaseUrls = [this.config.serveUrl + '/'];
                        }
                    });

                    resolve();
                } else {
                    reject(new Error('debugManifests not available'));
                }
            };
            script.onerror = () => reject(new Error('Failed to load manifests.js'));
            document.head.appendChild(script);
        });
    }

    async addWebPartAt(insertIndex: number, manifestIndex: number): Promise<void> {
        const webParts = this.loadedManifests.filter(m => m.componentType === 'WebPart');
        const manifest = webParts[manifestIndex];

        if (!manifest) {
            return;
        }

        const instanceId = 'wp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const properties = manifest.preconfiguredEntries?.[0]?.properties || {};

        const webPart: IActiveWebPart = {
            manifest: manifest,
            instanceId: instanceId,
            properties: JSON.parse(JSON.stringify(properties)),
            context: null,
            instance: null
        };

        this.activeWebParts.splice(insertIndex, 0, webPart);

        // Update React app
        if (this.appHandlers) {
            this.appHandlers.setActiveWebParts([...this.activeWebParts]);
        }

        // Allow DOM to update
        await new Promise(r => setTimeout(r, 50));

        // Instantiate the web part
        await this.instantiateWebPart(webPart, insertIndex);
    }

    async removeWebPart(index: number): Promise<void> {
        const webPart = this.activeWebParts[index];
        
        // Dispose the web part instance
        if (webPart?.instance?.dispose) {
            try {
                webPart.instance.dispose();
            } catch (e: any) {
                // Error disposing
            }
        }

        this.activeWebParts.splice(index, 1);

        // Update React app
        if (this.appHandlers) {
            this.appHandlers.setActiveWebParts([...this.activeWebParts]);
        }

        // Allow DOM to update
        await new Promise(r => setTimeout(r, 50));

        // Re-instantiate remaining web parts
        for (let i = 0; i < this.activeWebParts.length; i++) {
            await this.instantiateWebPart(this.activeWebParts[i], i);
        }
    }

    private async instantiateWebPart(webPart: IActiveWebPart, index: number): Promise<void> {
        const domElement = document.getElementById('webpart-' + index);
        if (!domElement) return;

        await this.webPartManager.instantiateWebPart(webPart, domElement);
    }

    openPropertyPane(webPart: IActiveWebPart): void {
        if (this.appHandlers) {
            this.appHandlers.openPropertyPane(webPart);
        }
    }
    
    updateWebPartProperty(instanceId: string, targetProperty: string, newValue: any): void {
        const webPart = this.activeWebParts.find(wp => wp.instanceId === instanceId);
        if (!webPart) return;

        // Update property
        webPart.properties[targetProperty] = newValue;

        // Call onPropertyPaneFieldChanged lifecycle if available
        if (webPart.instance && typeof webPart.instance.onPropertyPaneFieldChanged === 'function') {
            try {
                webPart.instance.onPropertyPaneFieldChanged(targetProperty, null, newValue);
            } catch (e: any) {
                console.error('Workbench - Error calling onPropertyPaneFieldChanged:', e);
            }
        }

        // Re-render the web part
        if (webPart.instance && typeof webPart.instance.render === 'function') {
            try {
                webPart.instance.render();
            } catch (e: any) {
                console.error('Workbench - Error rendering web part:', e);
            }
        }

        // Update React app
        if (this.appHandlers) {
            this.appHandlers.updateWebPartProperties(instanceId, { ...webPart.properties });
        }
    }

    private setupEventListeners(): void {
        // Toolbar buttons are now handled by React Toolbar component in App.tsx
        // Event listeners for toolbar actions are in main.tsx
    }

    handleRefresh(): void {
        this.vscode.postMessage({ command: 'refresh' });
    }

    handleOpenDevTools(): void {
        this.vscode.postMessage({ command: 'openDevTools' });
    }

    private updateStatus(message: string): void {
        const loadingStatus = document.getElementById('loading-status');
        const statusText = document.getElementById('status-text');
        if (loadingStatus) loadingStatus.textContent = message;
        if (statusText) statusText.textContent = message;
    }

    private updateConnectionStatus(connected: boolean): void {
        const statusDot = document.getElementById('status-dot');
        if (statusDot) {
            if (connected) {
                statusDot.classList.remove('disconnected');
            } else {
                statusDot.classList.add('disconnected');
            }
        }
    }

    private updateWebPartCount(count: number): void {
        const webPartCountEl = document.getElementById('webpart-count');
        if (webPartCountEl) {
            webPartCountEl.textContent = count + ' web part(s) available';
        }
    }

    // Public API for debugging
    getActiveWebParts(): IActiveWebPart[] {
        return this.activeWebParts;
    }

    getLoadedManifests(): IWebPartManifest[] {
        return this.loadedManifests;
    }
}
