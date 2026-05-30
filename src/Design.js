/*
 * Gestiona el diseño visual de la aplicación (independiente del tema claro/oscuro).
 * Aplica una clase CSS en <body> para que cada diseño tenga sus propios estilos.
 */

import './designs/current.css';
import './designs/android.css';
import './designs/ios.css';
import './designs/macos.css';
import './designs/tdesktop.css';
import './designs/unigram.css';
import './designs/aurora.css';
import './designs/shell.css';

const DESIGN_KEY = 'tg_design';
const DESIGNS = [
    'current',
    'android',
    'android-classic',
    'android-redesign',
    'android-glass',
    'ios',
    'macos',
    'tdesktop',
    'unigram',
    'aurora',
];
const DEFAULT_DESIGN = 'current';

export const DESIGN_LABELS = {
    current: 'Web',
    android: 'Android v16',
    'android-glass': 'Android v15',
    'android-redesign': 'Android v14',
    'android-classic': 'Android v13',
    ios: 'iOS',
    macos: 'macOS',
    tdesktop: 'Desktop',
    unigram: 'Unigram',
    aurora: 'Aurora',
};

export const DESIGN_ACCENTS = {
    current: '#5b8af1',
    android: '#229af0',
    'android-glass': '#28c9b7',
    'android-redesign': '#229af0',
    'android-classic': '#527da3',
    ios: '#007aff',
    macos: '#248bf2',
    tdesktop: '#40a7e3',
    unigram: '#2b7fe0',
    aurora: '#34d9a8',
};

export function getDesign() {
    return localStorage.getItem(DESIGN_KEY) || DEFAULT_DESIGN;
}

export function setDesign(name) {
    if (!DESIGNS.includes(name)) return;

    DESIGNS.forEach(d => document.body.classList.remove(`design-${d}`));
    document.body.classList.remove('design-android');

    if (name.startsWith('android-')) {
        document.body.classList.add('design-android');
    }

    document.body.classList.add(`design-${name}`);
    localStorage.setItem(DESIGN_KEY, name);
}

export function initDesign() {
    setDesign(getDesign());
}

export { DESIGNS };
