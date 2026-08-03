import React, { Component } from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import CloseIcon from '@material-ui/icons/Close';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import RefreshIcon from '@material-ui/icons/Refresh';
import AddIcon from '@material-ui/icons/Add';
import InternalBrowserStore, { normalizeBrowserUrl } from '../../Stores/InternalBrowserStore';
import './InternalBrowser.css';

const MAX_TABS = 10;

function newTab(url) {
    const parsed = new URL(url);
    return {
        id: `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,
        url,
        title: parsed.hostname,
        loading: true,
        history: [url],
        historyIndex: 0,
        revision: 0,
    };
}

class InternalBrowser extends Component {
    constructor(props) {
        super(props);
        this.state = { open: false, tabs: [], activeId: null, address: '' };
        this.frames = new Map();
    }

    componentDidMount() {
        InternalBrowserStore.on('open', this.openUrl);
        document.addEventListener('keydown', this.onKeyDown);
    }

    componentWillUnmount() {
        InternalBrowserStore.off('open', this.openUrl);
        document.removeEventListener('keydown', this.onKeyDown);
        this.frames.clear();
    }

    onKeyDown = event => {
        if (event.key === 'Escape' && this.state.open) this.closeBrowser();
    };

    openUrl = ({ url }) => {
        const normalized = normalizeBrowserUrl(url);
        if (!normalized) return;
        this.setState(state => {
            const existing = state.tabs.find(tab => tab.url === normalized);
            if (existing) return { open: true, activeId: existing.id, address: existing.url };
            const tab = newTab(normalized);
            const tabs = state.tabs.length >= MAX_TABS ? state.tabs.slice(1).concat(tab) : state.tabs.concat(tab);
            return { open: true, tabs, activeId: tab.id, address: tab.url };
        });
    };

    closeTab = (id, event) => {
        if (event) event.stopPropagation();
        this.setState(state => {
            const index = state.tabs.findIndex(tab => tab.id === id);
            const tabs = state.tabs.filter(tab => tab.id !== id);
            this.frames.delete(id);
            if (!tabs.length) return { tabs: [], activeId: null, address: '', open: false };
            if (state.activeId !== id) return { tabs };
            const next = tabs[Math.min(index, tabs.length - 1)];
            return { tabs, activeId: next.id, address: next.url };
        });
    };

    closeBrowser = () => this.setState({ open: false, tabs: [], activeId: null, address: '' });

    selectTab = id => {
        const tab = this.state.tabs.find(item => item.id === id);
        if (tab) this.setState({ activeId: id, address: tab.url });
    };

    navigate = event => {
        event.preventDefault();
        const url = normalizeBrowserUrl(this.state.address);
        if (!url) return;
        this.setState(state => ({
            address: url,
            tabs: state.tabs.map(tab => {
                if (tab.id !== state.activeId) return tab;
                const history = tab.history.slice(0, tab.historyIndex + 1).concat(url);
                return {
                    ...tab,
                    url,
                    title: new URL(url).hostname,
                    loading: true,
                    history,
                    historyIndex: history.length - 1,
                    revision: tab.revision + 1,
                };
            }),
        }));
    };

    frameAction = action => {
        this.setState(state => {
            const tabs = state.tabs.map(tab => {
                if (tab.id !== state.activeId) return tab;
                let historyIndex = tab.historyIndex;
                if (action === 'back') historyIndex = Math.max(0, historyIndex - 1);
                if (action === 'forward') historyIndex = Math.min(tab.history.length - 1, historyIndex + 1);
                const url = tab.history[historyIndex];
                return {
                    ...tab,
                    url,
                    title: new URL(url).hostname,
                    historyIndex,
                    loading: true,
                    revision: tab.revision + 1,
                };
            });
            const active = tabs.find(tab => tab.id === state.activeId);
            return { tabs, address: active ? active.url : state.address };
        });
    };

    render() {
        const { open, tabs, activeId, address } = this.state;
        if (!open) return null;
        const active = tabs.find(tab => tab.id === activeId);

        return (
            <div className='internal-browser' role='dialog' aria-label='Navegador interno'>
                <div className='internal-browser-tabs'>
                    {tabs.map(tab => (
                        <button
                            type='button'
                            key={tab.id}
                            className={`internal-browser-tab${
                                tab.id === activeId ? ' internal-browser-tab--active' : ''
                            }`}
                            onClick={() => this.selectTab(tab.id)}>
                            <span>{tab.title}</span>
                            <CloseIcon onClick={event => this.closeTab(tab.id, event)} />
                        </button>
                    ))}
                    <button
                        type='button'
                        className='internal-browser-icon'
                        title='Nueva pestaña'
                        disabled={tabs.length >= MAX_TABS}
                        onClick={() => this.openUrl({ url: 'https://telegram.org/' })}>
                        <AddIcon />
                    </button>
                    <button
                        type='button'
                        className='internal-browser-icon'
                        title='Cerrar navegador'
                        onClick={this.closeBrowser}>
                        <CloseIcon />
                    </button>
                </div>
                <div className='internal-browser-toolbar'>
                    <button
                        type='button'
                        title='Atrás'
                        disabled={!active || active.historyIndex === 0}
                        onClick={() => this.frameAction('back')}>
                        <ArrowBackIcon />
                    </button>
                    <button
                        type='button'
                        title='Adelante'
                        disabled={!active || active.historyIndex >= active.history.length - 1}
                        onClick={() => this.frameAction('forward')}>
                        <ArrowForwardIcon />
                    </button>
                    <button type='button' title='Recargar' onClick={() => this.frameAction('reload')}>
                        <RefreshIcon />
                    </button>
                    <form onSubmit={this.navigate}>
                        <input
                            value={address}
                            aria-label='Dirección web'
                            spellCheck={false}
                            onChange={event => this.setState({ address: event.target.value })}
                        />
                    </form>
                    <button
                        type='button'
                        title='Abrir en el navegador del sistema'
                        onClick={() => active && window.open(active.url, '_blank', 'noopener,noreferrer')}>
                        <OpenInNewIcon />
                    </button>
                </div>
                <div className='internal-browser-pages'>
                    {tabs.map(tab => (
                        <iframe
                            key={`${tab.id}-${tab.revision}`}
                            ref={node => (node ? this.frames.set(tab.id, node) : this.frames.delete(tab.id))}
                            className={
                                tab.id === activeId
                                    ? 'internal-browser-frame internal-browser-frame--active'
                                    : 'internal-browser-frame'
                            }
                            src={tab.url}
                            title={tab.title}
                            sandbox='allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads'
                            referrerPolicy='no-referrer'
                            onLoad={() =>
                                this.setState(state => ({
                                    tabs: state.tabs.map(item =>
                                        item.id === tab.id ? { ...item, loading: false } : item,
                                    ),
                                }))
                            }
                        />
                    ))}
                    {active && active.loading && <div className='internal-browser-loading'>Cargando...</div>}
                </div>
            </div>
        );
    }
}

export default InternalBrowser;
