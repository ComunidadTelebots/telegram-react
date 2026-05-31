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
import './designs/telegramx.css';

const DESIGN_KEY = 'tg_design';

// Variantes de Android: válidas y funcionales, pero ocultas del menú principal.
// AndroidVersionSelector las aplica directamente; DesignSwitcher solo expone DESIGNS.
const ANDROID_SUB_VARIANTS = [
    'android-holo',
    'android-v9',
    'android-v11',
    'android-classic',
    'android-redesign',
    'android-glass',
];

// Entradas visibles en el selector principal (DesignSwitcher)
const DESIGNS = ['current', 'android', 'unigram', 'ios', 'macos', 'tdesktop', 'aurora', 'telegramx'];

// Conjunto completo de nombres válidos (menú + sub-variantes Android)
const ALL_DESIGNS = [...DESIGNS, ...ANDROID_SUB_VARIANTS];

const DEFAULT_DESIGN = 'current';

export const DESIGN_LABELS = {
    current: 'Web (react)',
    android: 'Android',
    unigram: 'Unigram',
    ios: 'iOS',
    macos: 'macOS',
    tdesktop: 'Desktop',
    aurora: 'Aurora',
    telegramx: 'Telegram X',
};

export const DESIGN_ACCENTS = {
    current: '#5b8af1',
    android: '#229af0',
    unigram: '#2b7fe0',
    ios: '#007aff',
    macos: '#248bf2',
    tdesktop: '#40a7e3',
    aurora: '#34d9a8',
    telegramx: '#50a8eb',
};

export function getDesign() {
    const saved = localStorage.getItem(DESIGN_KEY) || DEFAULT_DESIGN;
    // Acepta tanto las entradas del menú como las sub-variantes Android
    return ALL_DESIGNS.includes(saved) ? saved : DEFAULT_DESIGN;
}

export function setDesign(name) {
    if (!ALL_DESIGNS.includes(name)) return;

    ALL_DESIGNS.forEach(d => document.body.classList.remove(`design-${d}`));
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
