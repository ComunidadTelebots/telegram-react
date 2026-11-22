import React from 'react';
import ReactDOM from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DESIGN_ACCENTS, setDesign, setEraFeatures } from '../../Design';
import TdLibController from '../../Controllers/TdLibController';
import EmojiPickerButton from './EmojiPickerButton';

vi.mock('react-i18next', () => ({
    withTranslation: () => Component => props => <Component {...props} t={(key, fallback) => fallback || key} />,
}));
vi.mock('emoji-mart', () => ({ Picker: () => null }));
vi.mock('./StickerPreview', () => ({ default: () => null }));
vi.mock('./StickersPicker', () => ({ default: () => null }));
vi.mock('../../Controllers/TdLibController', () => ({
    default: { send: vi.fn(), on: vi.fn(), off: vi.fn(), clientUpdate: vi.fn() },
}));
vi.mock('../../Stores/ApplicationStore', () => ({ default: { on: vi.fn(), off: vi.fn() } }));
vi.mock('../../Stores/LocalizationStore', () => ({ default: { on: vi.fn(), off: vi.fn() } }));
vi.mock('../../Stores/FileStore', () => ({ default: { getStore: () => ({}) } }));
vi.mock('../../Utils/File', () => ({
    loadStickerContent: vi.fn(), loadStickerThumbnailContent: vi.fn(),
    loadStickerSetContent: vi.fn(), loadRecentStickersContent: vi.fn(),
}));
vi.mock('../../Utils/Common', () => ({ isAppleDevice: () => false }));
vi.mock('../Message/Media/Sticker', () => ({ default: () => null, StickerSourceEnum: { PICKER: 1 } }));
vi.mock('../../Utils/GramJs/EntityTranslator', () => ({ translateSticker: vi.fn() }));

let root;
const renderChat = async chatId => {
    await act(async () => { ReactDOM.render(<EmojiPickerButton chatId={chatId} />, root); });
};
const trigger = () => root.querySelector('button[aria-label="Emoji and stickers"]');
const shortcut = async () => {
    await act(async () => { Simulate.keyDown(trigger(), { key: 'F10', shiftKey: true }); });
};

beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    TdLibController.send.mockResolvedValue({ stickers: [], groups: [] });
});

afterEach(() => {
    act(() => { ReactDOM.unmountComponentAtNode(root); });
    root.remove();
    localStorage.clear();
    document.body.className = '';
    vi.clearAllMocks();
});

it.each(Object.keys(DESIGN_ACCENTS))('opens from the keyboard in the %s design and restores focus', async design => {
    setDesign(design);
    await renderChat(12);
    trigger().focus();
    await shortcut();
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    act(() => { Simulate.click(dialog.querySelector('button')); });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger());
    expect(TdLibController.clientUpdate).not.toHaveBeenCalled();
});

it('dismisses favourites when switching chats', async () => {
    await renderChat(12);
    await shortcut();
    await renderChat(99);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(TdLibController.clientUpdate).not.toHaveBeenCalled();
});

it('preserves the historical composer when era-only features are selected', async () => {
    setEraFeatures(true);
    await renderChat(12);
    expect(trigger().getAttribute('aria-keyshortcuts')).toBeNull();
    await shortcut();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
});
