import React, { Component } from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import TdLibController from '../../Controllers/TdLibController';
import './StarGiftsGallery.css';

class GiftDetailModal extends Component {
    render() {
        const { gift, onClose } = this.props;
        if (!gift) return null;

        const canUpgrade = gift.can_upgrade || gift.canUpgrade;
        const upgradeStars = gift.upgrade_stars ?? gift.upgradeStars;
        const transferStars = gift.transfer_stars ?? gift.transferStars;
        const canExportAt = gift.can_export_at ?? gift.canExportAt;
        const refunded = gift.refunded;
        const nameHidden = gift.name_hidden ?? gift.nameHidden;
        const unsaved = gift.unsaved;

        const canTransfer = transferStars != null;
        const canResale = canExportAt != null;

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
                        <div className='stargift-modal-icon'>{refunded ? '🔄' : '⭐'}</div>
                        <div className='stargift-modal-stars'>{gift.stars != null ? `${gift.stars} ⭐` : '—'}</div>

                        {refunded && <div className='stargift-badge stargift-badge--refunded'>Reembolsado</div>}
                        {unsaved && <div className='stargift-badge stargift-badge--unsaved'>No guardado</div>}
                        {nameHidden && <div className='stargift-badge stargift-badge--anon'>Remitente anónimo</div>}

                        {gift.message && <div className='stargift-modal-message'>{gift.message}</div>}
                        <div className='stargift-modal-meta'>
                            {gift.date ? new Date(gift.date * 1000).toLocaleDateString() : ''}
                        </div>

                        <div className='stargift-actions'>
                            {/* Upgrade */}
                            <div className={`stargift-action${canUpgrade ? '' : ' stargift-action--disabled'}`}>
                                <span className='stargift-action-icon'>✨</span>
                                <div className='stargift-action-info'>
                                    <span className='stargift-action-label'>Mejorar regalo</span>
                                    {upgradeStars != null && (
                                        <span className='stargift-action-cost'>{upgradeStars} ⭐</span>
                                    )}
                                </div>
                                <span className='stargift-action-status'>
                                    {canUpgrade ? 'Disponible' : 'No disponible'}
                                </span>
                            </div>

                            {/* Transfer */}
                            <div className={`stargift-action${canTransfer ? '' : ' stargift-action--disabled'}`}>
                                <span className='stargift-action-icon'>↗</span>
                                <div className='stargift-action-info'>
                                    <span className='stargift-action-label'>Transferir</span>
                                    {transferStars != null && (
                                        <span className='stargift-action-cost'>{transferStars} ⭐</span>
                                    )}
                                </div>
                                <span className='stargift-action-status'>
                                    {canTransfer ? 'Disponible' : 'No disponible'}
                                </span>
                            </div>

                            {/* Resale */}
                            <div className={`stargift-action${canResale ? '' : ' stargift-action--disabled'}`}>
                                <span className='stargift-action-icon'>🏷</span>
                                <div className='stargift-action-info'>
                                    <span className='stargift-action-label'>Poner en venta</span>
                                    {canResale && canExportAt > 0 && (
                                        <span className='stargift-action-cost'>
                                            Disponible desde {new Date(canExportAt * 1000).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <span className='stargift-action-status'>
                                    {canResale
                                        ? canExportAt > Date.now() / 1000
                                            ? 'Pronto'
                                            : 'Disponible'
                                        : 'No disponible'}
                                </span>
                            </div>

                            {/* Convert */}
                            {gift.convert_stars != null && (
                                <div className='stargift-action'>
                                    <span className='stargift-action-icon'>💫</span>
                                    <div className='stargift-action-info'>
                                        <span className='stargift-action-label'>Convertir a estrellas</span>
                                        <span className='stargift-action-cost'>{gift.convert_stars} ⭐</span>
                                    </div>
                                    <span className='stargift-action-status'>Disponible</span>
                                </div>
                            )}
                        </div>
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
