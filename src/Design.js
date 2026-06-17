/*
 * Gestiona el diseño visual de la aplicación (independiente del tema claro/oscuro).
 * Aplica una clase CSS en <body> para que cada diseño tenga sus propios estilos.
 */

import './designs/current.css';
import './designs/current-compact.css';
import './designs/android.css';
import './designs/ios.css';
import './designs/ios-ipad.css';
import './designs/macos.css';
import './designs/macos-monterey.css';
import './designs/tdesktop.css';
import './designs/tdesktop-classic.css';
import './designs/unigram.css';
import './designs/unigram-fluent.css';
import './designs/aurora.css';
import './designs/aurora-midnight.css';
import './designs/shell.css';
import './designs/telegramx.css';
import './designs/telegramx-red.css';
import './designs/webogram.css';
import './designs/webogram-blue.css';
import './designs/webk.css';
import './designs/webk-2025.css';
import './designs/weba.css';
import './designs/weba-classic.css';

const DESIGN_KEY = 'tg_design';

// Entradas visibles en el selector principal (DesignSwitcher).
const DESIGNS = [
    'current',
    'webk',
    'weba',
    'android',
    'webogram',
    'unigram',
    'ios',
    'macos',
    'tdesktop',
    'aurora',
    'telegramx',
];

// Sub-variantes de cada familia (ocultas del menú principal; DesignVersionSelector las gestiona).
const DESIGN_SUB_VARIANTS = [
    // current
    'current-compact',
    // webk eras
    'webk-2020',
    'webk-2022',
    'webk-2025',
    // weba
    'weba-classic',
    // android
    'android-v1',
    'android-v2',
    'android-v3',
    'android-v35',
    'android-v4',
    'android-v5',
    'android-v8',
    'android-v9',
    'android-v11',
    'android-v12',
    'android-matyou',
    // android legacy (kept for backwards compat)
    'android-holo',
    'android-classic',
    'android-redesign',
    'android-glass',
    // ios eras
    'ios-7',
    'ios-10',
    'ios-14',
    'ios-ipad',
    // macos eras
    'macos-yosemite',
    'macos-bigsur',
    'macos-monterey',
    // tdesktop
    'tdesktop-classic',
    // unigram eras
    'unigram-wp',
    'unigram-fluent',
    // webogram
    'webogram-blue',
    // aurora
    'aurora-midnight',
    // telegramx
    'telegramx-red',
];

// Conjunto completo de nombres válidos
const ALL_DESIGNS = [...DESIGNS, ...DESIGN_SUB_VARIANTS];

const DEFAULT_DESIGN = 'current';

export const DESIGN_LABELS = {
    current: 'Web (react)',
    webk: 'Telegram Web K',
    weba: 'Telegram Web A',
    android: 'Android',
    webogram: 'Webogram',
    unigram: 'Unigram',
    ios: 'iOS',
    macos: 'macOS',
    tdesktop: 'Desktop',
    aurora: 'Aurora',
    telegramx: 'Telegram X',
};

export const DESIGN_ACCENTS = {
    current: '#5b8af1',
    'current-compact': '#5b8af1',
    webk: '#3390ec',
    'webk-2020': '#2481cc',
    'webk-2022': '#3390ec',
    'webk-2025': '#3390ec',
    weba: '#2ca5e0',
    'weba-classic': '#2ca5e0',
    android: '#229af0',
    // versiones históricas
    'android-v1': '#33b5e5',
    'android-v2': '#33b5e5',
    'android-v3': '#2196f3',
    'android-v35': '#2196f3',
    'android-v4': '#1976d2',
    'android-v5': '#2196f3',
    'android-v8': '#229af0',
    'android-v9': '#229af0',
    'android-v11': '#229af0',
    'android-v12': '#3390ec',
    'android-matyou': '#9b8fc7',
    // legacy
    'android-glass': '#28c9b7',
    'android-redesign': '#229af0',
    'android-classic': '#527da3',
    'android-holo': '#33b5e5',
    ios: '#0088ff',
    'ios-7': '#007aff',
    'ios-10': '#007aff',
    'ios-14': '#0a84ff',
    'ios-ipad': '#0088ff',
    macos: '#2481cc',
    'macos-yosemite': '#147efb',
    'macos-bigsur': '#0a84ff',
    'macos-monterey': '#5b5ea6',
    tdesktop: '#40a7e3',
    'tdesktop-classic': '#2b5278',
    unigram: '#40a7e3',
    'unigram-wp': '#0050ef',
    'unigram-fluent': '#0078d4',
    webogram: '#5682a3',
    'webogram-blue': '#1d7cba',
    aurora: '#34d9a8',
    'aurora-midnight': '#00e5c8',
    telegramx: '#35b7f3',
    'telegramx-red': '#e85050',
};

export function getDesign() {
    const saved = localStorage.getItem(DESIGN_KEY) || DEFAULT_DESIGN;
    return ALL_DESIGNS.includes(saved) ? saved : DEFAULT_DESIGN;
}

/**
 * Devuelve la familia base de un diseño.
 * 'android-glass' → 'android', 'ios-ipad' → 'ios', 'current' → 'current'.
 */
export function getDesignFamily(design) {
    const dashIdx = design.indexOf('-');
    if (dashIdx === -1) return design;
    const prefix = design.slice(0, dashIdx);
    return DESIGNS.includes(prefix) ? prefix : design;
}

export function setDesign(name) {
    if (!ALL_DESIGNS.includes(name)) return;

    // Quitar todas las clases de diseño existentes
    ALL_DESIGNS.forEach(d => document.body.classList.remove(`design-${d}`));
    DESIGNS.forEach(d => document.body.classList.remove(`design-${d}`));

    // Para sub-variantes, añadir también la clase de la familia base
    // (p.ej. 'ios-ipad' agrega 'design-ios' + 'design-ios-ipad')
    const family = getDesignFamily(name);
    if (family !== name) {
        document.body.classList.add(`design-${family}`);
    }

    document.body.classList.add(`design-${name}`);
    localStorage.setItem(DESIGN_KEY, name);
}

export function initDesign() {
    setDesign(getDesign());
}

export { DESIGNS };
