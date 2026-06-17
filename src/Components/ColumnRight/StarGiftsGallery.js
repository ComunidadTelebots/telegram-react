import React, { Component } from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import TdLibController from '../../Controllers/TdLibController';
import './StarGiftsGallery.css';

class GiftDetailModal extends Component {
    render() {
        const { gift, onClose } = this.props;
        if (!gift) return null;
        return (
            <div className='stargift-modal-backdrop' onClick={e => e.target === e.currentTarget && onClose()}>
                <div className='stargift-modal'>
                    <div className='stargift-modal-header'>
                        <span className='stargift-modal-title'>Regalo de estrellas</span>
                        <button className='stargift-modal-close' onClick={onClose}>
                            ✕
                        </button>
                    </div>
                    <div className='stargift-modal-body'>
                        <div className='stargift-modal-icon'>⭐</div>
                        <div className='stargift-modal-stars'>{gift.stars != null ? `${gift.stars} ⭐` : '—'}</div>
                        {gift.message && <div className='stargift-modal-message'>{gift.message}</div>}
                        <div className='stargift-modal-meta'>
                            {gift.date ? new Date(gift.date * 1000).toLocaleDateString() : ''}
                        </div>
                        {gift.convert_stars != null && (
                            <div className='stargift-modal-convert'>Valor de conversión: {gift.convert_stars} ⭐</div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

class StarGiftsGallery extends Component {
    constructor(props) {
        super(props);
        this.state = { gifts: [], loading: true, error: '', selectedGift: null };
    }

    componentDidMount() {
        this._load();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.chatId !== this.props.chatId) {
            this.setState({ gifts: [], loading: true, error: '', selectedGift: null });
            this._load();
        }
    }

    _load = async () => {
        const { chatId } = this.props;
        try {
            const result = await TdLibController.send({
                '@type': 'getSavedStarGifts',
                chat_id: chatId,
                offset: 0,
                limit: 100,
            });
            this.setState({ gifts: result.gifts || [], loading: false });
        } catch (err) {
            this.setState({ loading: false, error: err.message || 'Error al cargar regalos.' });
        }
    };

    render() {
        const { gifts, loading, error, selectedGift } = this.state;

        if (loading) {
            return (
                <div className='stargift-gallery-loading'>
                    <CircularProgress size={24} />
                </div>
            );
        }

        if (error) {
            return <div className='stargift-gallery-error'>{error}</div>;
        }

        if (gifts.length === 0) return null;

        return (
            <div className='stargift-gallery'>
                <div className='stargift-gallery-title'>Regalos de estrellas</div>
                <div className='stargift-gallery-grid'>
                    {gifts.map((gift, idx) => (
                        <button
                            key={gift.id || idx}
                            className='stargift-item'
                            onClick={() => this.setState({ selectedGift: gift })}>
                            <span className='stargift-item-icon'>⭐</span>
                            {gift.stars != null && <span className='stargift-item-stars'>{gift.stars}</span>}
                        </button>
                    ))}
                </div>
                {selectedGift && (
                    <GiftDetailModal gift={selectedGift} onClose={() => this.setState({ selectedGift: null })} />
                )}
            </div>
        );
    }
}

export default StarGiftsGallery;
