declare var t: {
    translate(x?: string, params?: Record<string, string | number | boolean>): string;
    setLanguage(x: string, callback: () => void): void;
    lang: string;
};

declare var __webpack_public_path__: string;

declare module '*.scss';
declare module '*.svg' {
    import React from 'react';
    const ReactComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    export default ReactComponent;
}

interface Window {
    isProductionWebsite?: boolean;
    _trackJs: {
        token: string;
        application: string;
    };
}

interface Navigator {
    msSaveBlob: (blob: Blob, name: string) => void;
    onLine: boolean;
}

interface Document {
    documentMode?: number;
}
