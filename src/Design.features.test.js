// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { DESIGN_ACCENTS, getDesign, getDesignFamily, initDesign } from './Design';

afterEach(() => {
    localStorage.clear();
    document.body.className = '';
});

it.each(Object.keys(DESIGN_ACCENTS))('keeps %s and its palette when migrating legacy feature preferences', design => {
    localStorage.setItem('tg_design', design);
    localStorage.setItem('tg_palette', 'forest');
    localStorage.setItem('tg_design_legacy_features', 'true');
    document.body.classList.add('design-legacy-features');

    initDesign();

    expect(getDesign()).toBe(design);
    expect(document.body.classList.contains('design-' + design)).toBe(true);
    expect(document.body.classList.contains('design-' + getDesignFamily(design))).toBe(true);
    expect(document.body.classList.contains('palette-forest')).toBe(true);
    expect(localStorage.getItem('tg_design_legacy_features')).toBeNull();
    expect(document.body.classList.contains('design-legacy-features')).toBe(false);
});
