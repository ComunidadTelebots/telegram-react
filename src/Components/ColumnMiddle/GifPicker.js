import React, { Component } from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import AppStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './GifPicker.css';

const GIPHY_KEY = 'dc6zaTOxFJmzC';

function buildUrl(query) {
    if (!query) {
        return `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=20&rating=g`;
    }
    return `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`;
}

class GifPicker extends Component {
    constructor(props) {
        super(props);
        this.state = { query: '', gifs: [], loading: false };
        this.debounce = null;
    }

    componentDidMount() {
        this.fetchGifs('');
    }

    fetchGifs = async query => {
        this.setState({ loading: true });
        try {
            const res = await fetch(buildUrl(query));
            const json = await res.json();
            this.setState({ gifs: json.data || [], loading: false });
        } catch {
            this.setState({ loading: false });
        }
    };

    handleQueryChange = e => {
        const query = e.target.value;
        this.setState({ query });
        clearTimeout(this.debounce);
        this.debounce = setTimeout(() => this.fetchGifs(query), 350);
    };

    handleGifClick = async gif => {
        const url = gif.images?.original?.url || gif.url;
        const chatId = AppStore.getChatId();
        if (!chatId || !url) return;

        this.props.onClose && this.props.onClose();

        try {
            await TdLibController.send({
                '@type': 'sendGifByUrl',
                chat_id: chatId,
                url,
            });
        } catch (e) {
            console.warn('[GifPicker] sendGifByUrl error', e);
        }
    };

    render() {
        const { query, gifs, loading } = this.state;

        return (
            <div className='gif-picker'>
                <div className='gif-picker-search'>
                    <input
                        className='gif-picker-input'
                        placeholder='Buscar GIFs...'
                        value={query}
                        onChange={this.handleQueryChange}
                        autoFocus
                    />
                </div>
                <div className='gif-picker-grid'>
                    {loading && (
                        <div className='gif-picker-loading'>
                            <CircularProgress size={28} />
                        </div>
                    )}
                    {!loading && gifs.length === 0 && <div className='gif-picker-empty'>Sin resultados</div>}
                    {gifs.map(gif => (
                        <div
                            key={gif.id}
                            className='gif-picker-item'
                            onClick={() => this.handleGifClick(gif)}
                            title={gif.title}>
                            <img
                                src={gif.images?.fixed_height_small?.url || gif.images?.fixed_width?.url}
                                alt={gif.title}
                                loading='lazy'
                            />
                        </div>
                    ))}
                </div>
                <div className='gif-picker-attribution'>
                    Powered by <strong>GIPHY</strong>
                </div>
            </div>
        );
    }
}

export default GifPicker;
