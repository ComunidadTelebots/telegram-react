import { afterEach, describe, expect, it, vi } from 'vitest';
import { offersAmpReader } from '../../Utils/AmpArticle';
import { fetchAmpContent } from './AmpViewer';

const origin = 'https://editor.example/noticias/hoy';
const amp = 'https://editor.example/amp/hoy';
const article = text => '<article><h1>' + text + '</h1><p>' + text.repeat(120) + '</p></article>';

function serve(pages) {
    const request = vi.fn(async url => {
        if (!pages[url]) throw new Error('unavailable');
        return { ok: true, url, text: async () => pages[url] };
    });
    vi.stubGlobal('fetch', request);
    return request;
}

afterEach(() => vi.unstubAllGlobals());

describe('lector AMP desde el chat', () => {
    it('reconoce enlaces directos sin metadatos de artículo', () => {
        expect(offersAmpReader(amp, '')).toBe(true);
        expect(offersAmpReader(origin, 'article')).toBe(true);
        expect(offersAmpReader(origin, 'video')).toBe(false);
        expect(offersAmpReader('http://editor.example/amp/hoy')).toBe(false);
    });

    it('sigue la variante del editor y resuelve enlaces e imágenes relativos', async () => {
        const html = article('Edición AMP').replace('</article>', '<a href="otra">Otra</a><amp-img src="/foto.jpg"></amp-img></article>');
        const request = serve({ [origin]: '<link rel="AMPHTML" href="../amp/hoy">', [amp]: html });
        const result = await fetchAmpContent(origin);
        expect(request.mock.calls.map(([url]) => url)).toEqual([origin, amp]);
        expect(result.title).toBe('Edición AMP');
        expect(result.html).toContain('https://editor.example/amp/otra');
        expect(result.html).toContain('https://editor.example/foto.jpg');
    });

    it('conserva el artículo original cuando falla la versión AMP', async () => {
        serve({ [origin]: '<link rel="amphtml" href="/amp/hoy">' + article('Original') });
        expect((await fetchAmpContent(origin)).title).toBe('Original');
    });

    it('ignora protocolos ajenos a la web en el enlace AMP y el artículo', async () => {
        const request = serve({ [origin]: '<link rel="amphtml" href="data:text/plain,amp">' +
            article('Original').replace('</article>', '<a href="file:///tmp/a">Enlace</a></article>') });
        expect((await fetchAmpContent(origin)).html).not.toContain('file:');
        expect(request).toHaveBeenCalledTimes(1);
    });
});
