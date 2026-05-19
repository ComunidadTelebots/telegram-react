/*
 * Gestiona el diseño visual de la aplicación (independiente del tema claro/oscuro).
 * Aplica una clase CSS en <body> para que cada diseño tenga sus propios estilos.
 */

import './designs/current.css';
import './designs/macos.css';
import './designs/tdesktop.css';

const DESIGN_KEY = 'tg_design';
const DESIGNS = ['current', 'macos', 'tdesktop'];
const DEFAULT_DESIGN = 'current';

export function getDesign() {
    return localStorage.getItem(DESIGN_KEY) || DEFAULT_DESIGN;
}

export function setDesign(name) {
    if (!DESIGNS.includes(name)) return;

    DESIGNS.forEach(d => document.body.classList.remove(`design-${d}`));
    document.body.classList.add(`design-${name}`);
    localStorage.setItem(DESIGN_KEY, name);
}

export function initDesign() {
    setDesign(getDesign());
}

export { DESIGNS };
