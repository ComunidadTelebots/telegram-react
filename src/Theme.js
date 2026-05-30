/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import blue from '@material-ui/core/colors/blue';
import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';
import { StylesProvider } from '@material-ui/core/styles';
import { getDisplayName } from './Utils/HOC';
import Cookies from 'universal-cookie';
import ApplicationStore from './Stores/ApplicationStore';
import { getDesign } from './Design';

function updateLightTheme(theme) {
    // const root = document.querySelector(':root');
    // const style = getComputedStyle(root);
    const { style } = document.documentElement;

    style.setProperty('--color-accent-main', theme.palette.primary.main);
    style.setProperty('--color-accent-dark', theme.palette.primary.dark);
    style.setProperty('--color-accent-light', theme.palette.primary.light);

    style.setProperty('--badge-green', '#4DCD5E');
    style.setProperty('--badge-gray', '#C4C9CC');

    style.setProperty('--indicator-green', '#0AC630');

    style.setProperty('--day-color', '#FFFFFF');
    style.setProperty('--day-background', '#00000033');

    style.setProperty('--message-in-link', theme.palette.primary.main);
    style.setProperty('--message-in-author', theme.palette.primary.main);
    style.setProperty('--message-in-background', '#FFFFFF');
    style.setProperty('--message-in-color', '#000000');
    style.setProperty('--message-in-meta-color', '#8D969C');
    style.setProperty('--message-in-reply-title', theme.palette.primary.main);
    style.setProperty('--message-in-reply-border', theme.palette.primary.main);

    style.setProperty('--message-out-link', '#4FAE4E');
    style.setProperty('--message-out-author', '#4FAE4E');
    style.setProperty('--message-out-background', '#EEFFDE');
    style.setProperty('--message-out-color', '#000000');
    style.setProperty('--message-out-meta-color', '#4FAE4E');
    style.setProperty('--message-out-reply-title', '#4FAE4E');
    style.setProperty('--message-out-reply-border', '#4FAE4E');
}

function updateDarkTheme(theme) {
    // const root = document.querySelector(':root');
    // const style = getComputedStyle(root);
    const { style } = document.documentElement;

    style.setProperty('--color-accent-main', theme.palette.primary.main);
    style.setProperty('--color-accent-dark', theme.palette.primary.dark);
    style.setProperty('--color-accent-light', theme.palette.primary.light);

    style.setProperty('--badge-green', '#4DCD5E');
    style.setProperty('--badge-gray', 'rgba(255, 255, 255, 0.5)');

    style.setProperty('--indicator-green', '#0AC630');

    style.setProperty('--day-color', '#FFFFFF');
    style.setProperty('--day-background', '#303030');

    style.setProperty('--message-in-link', theme.palette.primary.main);
    style.setProperty('--message-in-author', theme.palette.primary.main);
    style.setProperty('--message-in-background', '#303030'); // background.default
    style.setProperty('--message-in-color', '#FFFFFF');
    style.setProperty('--message-in-meta-color', 'rgba(255, 255, 255, 0.7)');
    style.setProperty('--message-in-reply-title', theme.palette.primary.main);
    style.setProperty('--message-in-reply-border', theme.palette.primary.main);

    style.setProperty('--message-out-link', theme.palette.primary.main);
    style.setProperty('--message-out-author', theme.palette.primary.main);
    style.setProperty('--message-out-background', '#303030'); // background.default
    style.setProperty('--message-out-color', '#FFFFFF');
    style.setProperty('--message-out-meta-color', 'rgba(255, 255, 255, 0.7)'); // text.secondary
    style.setProperty('--message-out-reply-title', theme.palette.primary.main);
    style.setProperty('--message-out-reply-border', theme.palette.primary.main);
}

function updateThemeClass(type) {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(type === 'dark' ? 'theme-dark' : 'theme-light');
}

// Configuración MUI específica por diseño: radio de bordes, acento y tipografía
const DESIGN_MUI = {
    current: { radius: 8, accent: null, font: "'Roboto', sans-serif", type: null },
    android: { radius: 12, accent: '#229AF0', font: "'Roboto', 'Noto Sans', sans-serif", type: null },
    'android-classic': { radius: 4, accent: '#527DA3', font: "'Roboto', 'Noto Sans', sans-serif", type: null },
    'android-redesign': { radius: 16, accent: '#229AF0', font: "'Roboto', 'Noto Sans', sans-serif", type: null },
    'android-glass': { radius: 18, accent: '#28C9B7', font: "'Roboto', 'Noto Sans', sans-serif", type: null },
    ios: { radius: 16, accent: '#007AFF', font: "-apple-system, 'Helvetica Neue', sans-serif", type: null },
    macos: { radius: 10, accent: '#248BF2', font: "-apple-system, 'Helvetica Neue', sans-serif", type: null },
    tdesktop: { radius: 4, accent: '#40A7E3', font: "'Segoe UI', system-ui, sans-serif", type: null },
    unigram: { radius: 4, accent: '#2B7FE0', font: "'Segoe UI', 'Segoe UI Variable Text', sans-serif", type: null },
    aurora: { radius: 14, accent: '#34D9A8', font: "'Manrope', 'Inter', system-ui, sans-serif", type: 'dark' },
};

const DEFAULT_PRIMARY = { main: '#5B8AF1' };

function normalizePrimary(primary) {
    if (!primary || typeof primary !== 'object') {
        return DEFAULT_PRIMARY;
    }

    if (typeof primary.main === 'string' || typeof primary[500] === 'string') {
        return primary;
    }

    return DEFAULT_PRIMARY;
}

function createTheme(type, primary) {
    const design = getDesign();
    const dc = DESIGN_MUI[design] || DESIGN_MUI.current;

    // Aurora es siempre dark; el resto respeta la elección del usuario
    const effectiveType = dc.type || type;
    // El acento del diseño sobreescribe la elección de color del usuario
    const effectivePrimary = dc.accent ? { main: dc.accent } : normalizePrimary(primary);

    const theme = createMuiTheme({
        palette: {
            type: effectiveType,
            primary: effectivePrimary,
            secondary: { main: '#E53935' },
        },
        typography: {
            useNextVariants: true,
            fontFamily: dc.font,
        },
        shape: {
            borderRadius: dc.radius,
        },
        overrides: {
            MuiOutlinedInput: {
                input: {
                    padding: '17.5px 14px',
                },
            },
            MuiAutocomplete: {
                option: {
                    paddingLeft: 0,
                    paddingTop: 0,
                    paddingRight: 0,
                    paddingBottom: 0,
                },
                paper: {
                    '& > ul': {
                        maxHeight: 56 * 5.5,
                    },
                },
            },
        },
    });

    if (effectiveType === 'dark') {
        updateDarkTheme(theme);
    } else {
        updateLightTheme(theme);
    }
    updateThemeClass(effectiveType);

    // Si el diseño tiene un acento propio, sobreescribir el token CSS
    if (dc.accent) {
        document.documentElement.style.setProperty('--color-accent-main', dc.accent);
    }

    return theme;
}

function withTheme(WrappedComponent) {
    class ThemeWrapper extends React.Component {
        constructor(props) {
            super(props);

            const cookies = new Cookies();
            const { type, primary } = cookies.get('themeOptions') || { type: 'light', primary: { main: '#5B8AF1' } };
            const theme = createTheme(type, primary);

            this.state = { theme };
        }

        componentDidMount() {
            ApplicationStore.on('clientUpdateThemeChanging', this.onClientUpdateThemeChanging);
        }

        componentWillUnmount() {
            ApplicationStore.off('clientUpdateThemeChanging', this.onClientUpdateThemeChanging);
        }

        onClientUpdateThemeChanging = update => {
            const { type, primary } = update;

            const theme = createTheme(type, primary);
            const cookies = new Cookies();
            cookies.set('themeOptions', { type: type, primary: primary });

            this.setState({ theme }, () => ApplicationStore.emit('clientUpdateThemeChange'));
        };

        render() {
            const { theme } = this.state;

            return (
                <StylesProvider injectFirst={true}>
                    <MuiThemeProvider theme={theme}>
                        <WrappedComponent {...this.props} />
                    </MuiThemeProvider>
                </StylesProvider>
            );
        }
    }
    ThemeWrapper.displayName = `WithTheme(${getDisplayName(WrappedComponent)})`;

    return ThemeWrapper;
}

export default withTheme;
