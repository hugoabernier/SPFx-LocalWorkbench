import React, { useState, useEffect, FC } from 'react';
import type { IWorkbenchConfig, IWebPartManifest, IActiveWebPart } from '../types';
import { WorkbenchCanvas } from './WorkbenchCanvas';
import { PropertyPanePanel } from './PropertyPanePanel';
import { ErrorBoundary } from './ErrorBoundary';
import { Toolbar } from './Toolbar';

interface IAppProps {
    config: IWorkbenchConfig;
    onInitialized: (handlers: IAppHandlers) => void;
}

export interface IAppHandlers {
    setManifests: (manifests: IWebPartManifest[]) => void;
    setActiveWebParts: (webParts: IActiveWebPart[]) => void;
    openPropertyPane: (webPart: IActiveWebPart) => void;
    closePropertyPane: () => void;
    updateWebPartProperties: (instanceId: string, properties: any) => void;
}

export const App: FC<IAppProps> = ({ config, onInitialized }) => {
    const [manifests, setManifests] = useState<IWebPartManifest[]>([]);
    const [activeWebParts, setActiveWebParts] = useState<IActiveWebPart[]>([]);
    const [selectedWebPart, setSelectedWebPart] = useState<IActiveWebPart | null>(null);

    // Expose handlers to parent (WorkbenchRuntime)
    useEffect(() => {
        const handlers: IAppHandlers = {
            setManifests,
            setActiveWebParts,
            openPropertyPane: (webPart: IActiveWebPart) => setSelectedWebPart(webPart),
            closePropertyPane: () => setSelectedWebPart(null),
            updateWebPartProperties: (instanceId: string, properties: any) => {
                setActiveWebParts(prev => prev.map(wp => 
                    wp.instanceId === instanceId ? { ...wp, properties } : wp
                ));
                // Update selectedWebPart if it's the one being modified
                setSelectedWebPart(prev => {
                    if (prev && prev.instanceId === instanceId) {
                        return { ...prev, properties };
                    }
                    return prev;
                });
            }
        };
        onInitialized(handlers);
    }, [onInitialized]);

    const handleRefresh = () => {
        window.dispatchEvent(new CustomEvent('refresh'));
    };

    const handleOpenDevTools = () => {
        window.dispatchEvent(new CustomEvent('openDevTools'));
    };

    return (
        <ErrorBoundary>
            <div className="workbench-app">
                <Toolbar onRefresh={handleRefresh} onOpenDevTools={handleOpenDevTools} />
                <WorkbenchCanvas
                    manifests={manifests}
                    activeWebParts={activeWebParts}
                    onAddWebPart={(insertIndex, manifestIndex) => {
                        // Dispatch event to runtime
                        window.dispatchEvent(new CustomEvent('addWebPart', { 
                            detail: { insertIndex, manifestIndex } 
                        }));
                    }}
                    onEditWebPart={(index) => {
                        const webPart = activeWebParts[index];
                        if (webPart) {
                            setSelectedWebPart(webPart);
                        }
                    }}
                    onDeleteWebPart={(index) => {
                        // Dispatch event to runtime
                        window.dispatchEvent(new CustomEvent('deleteWebPart', { 
                            detail: { index } 
                        }));
                    }}
                />
                <PropertyPanePanel
                    webPart={selectedWebPart}
                    onClose={() => setSelectedWebPart(null)}
                    onPropertyChange={(targetProperty, newValue) => {
                        if (selectedWebPart) {
                            // Dispatch event to runtime
                            window.dispatchEvent(new CustomEvent('updateProperty', {
                                detail: {
                                    instanceId: selectedWebPart.instanceId,
                                    targetProperty,
                                    newValue
                                }
                            }));
                        }
                    }}
                />
            </div>
        </ErrorBoundary>
    );
};
