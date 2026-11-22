import { afterEach, describe, expect, it } from 'vitest';
import { listArticles, saveArticle, removeArticle } from './ReadingLibrary';

afterEach(() => localStorage.clear());

describe('biblioteca de lectura', () => {
    const url = 'https://editor.example/tema';
    it('recupera el texto guardado y conserva una copia por URL y cuenta', () => {
        saveArticle(101, url, 'Primera', 'Texto');
        saveArticle(101, url, 'Revisada', 'Texto completo');
        saveArticle(202, url, 'Otra cuenta', 'Privado');
        expect(listArticles(101)).toHaveLength(1);
        expect(listArticles(101)[0].text).toBe('Texto completo');
        removeArticle(101, url);
        expect(listArticles(101)).toEqual([]);
        expect(listArticles(202)[0].text).toBe('Privado');
    });
    it('requiere cuenta, texto y una dirección web válida', () => {
        expect(() => saveArticle(0, url, '', 'Texto')).toThrow();
        expect(() => saveArticle(101, 'file:///tmp', '', 'Texto')).toThrow();
        expect(() => saveArticle(101, url, '', ' ')).toThrow();
    });
});