import InternalBrowserStore from '../Stores/InternalBrowserStore';

export function openInternalBrowser(url) {
    return InternalBrowserStore.open(url);
}
