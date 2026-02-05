import type { ThemeSettings } from '../types';

const defaultTheme: ThemeSettings = {
    primaryColor: '#0078d4',
    backgroundColor: '#ffffff',
    textColor: '#323130'
};

export class ThemeProvider {
    private themeSettings: ThemeSettings;
    public sharePointTheme: any;

    constructor(themeSettings?: ThemeSettings) {
        this.themeSettings = { ...defaultTheme, ...themeSettings };
        this.sharePointTheme = this.createSharePointTheme();
    }

    private createSharePointTheme(): any {
        return {
            palette: {
                themePrimary: this.themeSettings.primaryColor,
                themeLighterAlt: '#eff6fc',
                themeLighter: '#deecf9',
                themeLight: '#c7e0f4',
                themeTertiary: '#71afe5',
                themeSecondary: '#2b88d8',
                themeDarkAlt: '#106ebe',
                themeDark: '#005a9e',
                themeDarker: '#004578',
                neutralLighterAlt: '#faf9f8',
                neutralLighter: '#f3f2f1',
                neutralLight: '#edebe9',
                neutralQuaternaryAlt: '#e1dfdd',
                neutralQuaternary: '#d0d0d0',
                neutralTertiaryAlt: '#c8c6c4',
                neutralTertiary: '#a19f9d',
                neutralSecondary: '#605e5c',
                neutralPrimaryAlt: '#3b3a39',
                neutralPrimary: this.themeSettings.textColor || '#323130',
                neutralDark: '#201f1e',
                black: '#000000',
                white: this.themeSettings.backgroundColor || '#ffffff'
            },
            semanticColors: {
                bodyBackground: this.themeSettings.backgroundColor || '#ffffff',
                bodyText: this.themeSettings.textColor || '#323130',
                bodyTextChecked: '#000000',
                link: this.themeSettings.primaryColor || '#0078d4',
                linkHovered: '#004578',
                primaryButtonBackground: this.themeSettings.primaryColor || '#0078d4',
                primaryButtonBorder: 'transparent',
                primaryButtonText: '#ffffff',
                inputBorder: '#605e5c',
                inputBackground: '#ffffff',
                inputText: '#323130'
            },
            fonts: {
                tiny: { fontSize: '10px' },
                xSmall: { fontSize: '11px' },
                small: { fontSize: '12px' },
                smallPlus: { fontSize: '13px' },
                medium: { fontSize: '14px' },
                mediumPlus: { fontSize: '15px' },
                large: { fontSize: '17px' },
                xLarge: { fontSize: '21px' },
                xxLarge: { fontSize: '28px' },
                superLarge: { fontSize: '42px' },
                mega: { fontSize: '68px' }
            },
            isInverted: false,
            disableGlobalClassNames: false
        };
    }

    applyThemeToWebPart(domElement: HTMLElement): void {
        domElement.style.setProperty('--themePrimary', this.themeSettings.primaryColor || '#0078d4');
        domElement.style.setProperty('--bodyBackground', this.themeSettings.backgroundColor || '#ffffff');
        domElement.style.setProperty('--bodyText', this.themeSettings.textColor || '#323130');
        domElement.style.fontFamily = "'Segoe UI', 'Segoe UI Web (West European)', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif";
    }

    getTheme(): any {
        return this.sharePointTheme;
    }
}
