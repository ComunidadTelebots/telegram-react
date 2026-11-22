// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { DESIGN_ACCENTS, getDesign, getDesignFamily, hasStoryTrayForDesign, initDesign, setDesign, setEraFeatures, usesEraFeatures } from './Design';

afterEach(() => {
    localStorage.clear();
    document.body.className = '';
});

it.each(Object.keys(DESIGN_ACCENTS))('keeps %s and its palette when restoring the selected feature mode', design => {
    localStorage.setItem('tg_design', design);
    localStorage.setItem('tg_palette', 'forest');
    localStorage.setItem('tg_design_legacy_features', 'true');
    document.body.classList.add('design-legacy-features');

    initDesign();

    expect(getDesign()).toBe(design);
    expect(document.body.classList.contains('design-' + design)).toBe(true);
    expect(document.body.classList.contains('design-' + getDesignFamily(design))).toBe(true);
    expect(document.body.classList.contains('palette-forest')).toBe(true);
    expect(usesEraFeatures()).toBe(true);
    expect(document.body.classList.contains('design-legacy-features')).toBe(true);
    setEraFeatures(false);
    initDesign();
    expect(usesEraFeatures()).toBe(false);
    expect(hasStoryTrayForDesign()).toBe(true);
    expect(document.body.classList.contains('design-legacy-features')).toBe(false);
});

it('updates the story tray when switching timelines and preserves the user choice', () => {
    initDesign();
    expect(usesEraFeatures()).toBe(false);
    setEraFeatures(true);
    setDesign('webogram');
    expect(hasStoryTrayForDesign()).toBe(false);
    setDesign('android-v12');
    expect(hasStoryTrayForDesign()).toBe(true);
    setDesign('webk-2020');
    expect(hasStoryTrayForDesign()).toBe(false);
    setEraFeatures(false);
    expect(hasStoryTrayForDesign()).toBe(true);
});
