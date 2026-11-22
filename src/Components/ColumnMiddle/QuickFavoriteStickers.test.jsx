import React from 'react';
import ReactDOM from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import TdLibController from '../../Controllers/TdLibController';
import QuickFavoriteStickers from './QuickFavoriteStickers';

vi.mock('../../Controllers/TdLibController', () => ({ default: { send: vi.fn() } }));
vi.mock('../../Stores/FileStore', () => ({ default: { getStore: () => ({}) } }));
vi.mock('../../Utils/File', () => ({ loadStickerContent: vi.fn(), loadStickerThumbnailContent: vi.fn() }));
vi.mock('../Message/Media/Sticker', () => ({ default: () => null, StickerSourceEnum: { PICKER: 1 } }));
vi.mock('../../Utils/GramJs/EntityTranslator', () => ({
    translateSticker: doc => ({ sticker: { id: doc.id }, emoji: '🙂' }),
}));

let root;
const show = async onSelect => {
    await act(async () => {
        ReactDOM.render(<QuickFavoriteStickers t={(key, fallback) => fallback} onSelect={onSelect} onClose={() => {}} />, root);
    });
};

beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
});
afterEach(() => {
    act(() => { ReactDOM.unmountComponentAtNode(root); });
    root.remove();
    vi.clearAllMocks();
});

it('waits for an explicit choice and sends the selected sticker only once', async () => {
    const onSelect = vi.fn();
    TdLibController.send.mockResolvedValue({ stickers: [{ id: '123' }] });
    await show(onSelect);
    expect(onSelect).not.toHaveBeenCalled();
    const button = document.querySelector('[aria-label^="Send sticker"]');
    act(() => { Simulate.click(button); Simulate.click(button); });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].sticker.id).toBe('123');
});

it('shows an empty state for accounts without favourites', async () => {
    TdLibController.send.mockResolvedValue({ stickers: [] });
    await show(vi.fn());
    expect(document.body.textContent).toContain('No favorite stickers yet');
    expect(document.querySelector('[aria-label^="Send sticker"]')).toBeNull();
});

it('shows an error when the request fails', async () => {
    TdLibController.send.mockRejectedValue(new Error('offline'));
    await show(vi.fn());
    expect(document.querySelector('[role="alert"]').textContent).toMatch(/Could not load/);
});
