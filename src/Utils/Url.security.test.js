import { describe, expect, it } from 'vitest';
import { getDecodedUrl, isUrlSafe, validateUrl } from './Url';

describe('seguridad de enlaces de mensajes', () => {
    const normal = 'https://example.org/docs';
    it('permite un enlace cuyo texto coincide y pide confirmación si difiere', () => {
        expect(isUrlSafe(normal, normal)).toBe(true);
        expect(isUrlSafe('Otro destino', normal)).toBe(false);
    });
    it('pide confirmación cuando el destino incluye credenciales', () => {
        expect(isUrlSafe(null, 'https://usuario@example.org')).toBe(false);
    });
    it('mantiene codificados los controles de dirección en el diálogo', () => {
        const url = normal + '/%E2%81%A6abc';
        expect(isUrlSafe(null, url)).toBe(false);
        expect(getDecodedUrl(url)).toBe(url);
    });
    it('acepta únicamente nombres de protocolo completos', () => {
        expect(validateUrl('httpother://example.org')).toBeNull();
        expect(validateUrl(normal)).toBe(normal);
    });
});
