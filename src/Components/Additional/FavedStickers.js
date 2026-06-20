import React from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import CircularProgress from '@material-ui/core/CircularProgress';
import TdLibController from '../../Controllers/TdLibController';
import FileStore from '../../Stores/FileStore';
import { getSrc } from '../../Utils/File';
import './FavedStickers.css';

class FavedStickers extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = { open: false, loading: false, stickers: [] };
    }

    open() {
        this.setState({ open: true, loading: true, stickers: [] });
        TdLibController.send({ '@type': 'getFavedStickers' })
            .then(r => this.setState({ stickers: r.stickers || [], loading: false }))
            .catch(() => this.setState({ loading: false }));
    }

    handleClose = () => this.setState({ open: false });

    handleUnfave = async sticker => {
        try {
            await TdLibController.send({
                '@type': 'faveSticker',
                document_id: sticker.id,
                access_hash: sticker.access_hash,
                file_reference: sticker.file_reference,
                unfave: true,
            });
            this.setState(prev => ({ stickers: prev.stickers.filter(s => s.id !== sticker.id) }));
        } catch {}
    };

    render() {
        const { open, loading, stickers } = this.state;
        if (!open) return null;

        return (
            <div className='faved-stickers-overlay'>
                <div className='faved-stickers-toolbar'>
                    <button className='faved-stickers-back' onClick={this.handleClose}>
                        <ArrowBackIcon />
                    </button>
                    <span className='faved-stickers-title'>Favorite Stickers</span>
                </div>
                <div className='faved-stickers-content'>
                    {loading && (
                        <div className='faved-stickers-loading'>
                            <CircularProgress size={28} />
                        </div>
                    )}
                    {!loading && stickers.length === 0 && (
                        <div className='faved-stickers-empty'>No favorite stickers yet</div>
                    )}
                    <div className='faved-stickers-grid'>
                        {stickers.map(sticker => {
                            const file = sticker.thumbnail ? FileStore.get(sticker.thumbnail.photo?.id) : null;
                            const src = file ? getSrc(file) : null;
                            return (
                                <div key={sticker.id} className='faved-sticker-item'>
                                    {src ? (
                                        <img src={src} alt='' className='faved-sticker-img' />
                                    ) : (
                                        <div className='faved-sticker-placeholder'>🎭</div>
                                    )}
                                    <button
                                        className='faved-sticker-remove'
                                        onClick={() => this.handleUnfave(sticker)}
                                        title='Remove from favorites'>
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }
}

export default FavedStickers;
