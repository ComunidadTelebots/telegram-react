import React from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import CircularProgress from '@material-ui/core/CircularProgress';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import TdLibController from '../../Controllers/TdLibController';
import './AdminLog.css';
import './JoinRequests.css';

class JoinRequests extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = { open: false, chatId: null, loading: false, importers: [], processing: new Set() };
    }

    open(chatId) {
        this.setState({ open: true, chatId, importers: [], loading: true, processing: new Set() });
        TdLibController.send({ '@type': 'getJoinRequests', chat_id: chatId })
            .then(r => this.setState({ importers: r.importers || [], loading: false }))
            .catch(() => this.setState({ loading: false }));
    }

    handleClose = () => this.setState({ open: false });

    handleDecide = async (userId, approved) => {
        const { chatId, processing } = this.state;
        if (processing.has(userId)) return;
        const next = new Set(processing);
        next.add(userId);
        this.setState({ processing: next });
        try {
            await TdLibController.send({ '@type': 'approveJoinRequest', chat_id: chatId, user_id: userId, approved });
            this.setState(prev => ({
                importers: prev.importers.filter(i => i.user_id !== userId),
                processing: (() => {
                    const s = new Set(prev.processing);
                    s.delete(userId);
                    return s;
                })(),
            }));
        } catch {
            this.setState(prev => {
                const s = new Set(prev.processing);
                s.delete(userId);
                return { processing: s };
            });
        }
    };

    render() {
        const { open, loading, importers, processing } = this.state;
        if (!open) return null;

        return (
            <div className='admin-log-overlay'>
                <div className='admin-log-toolbar'>
                    <button className='admin-log-back' onClick={this.handleClose}>
                        <ArrowBackIcon />
                    </button>
                    <span className='admin-log-title'>Join Requests ({importers.length})</span>
                </div>
                <div className='admin-log-content'>
                    {loading && (
                        <div className='admin-log-loading'>
                            <CircularProgress size={28} />
                        </div>
                    )}
                    {!loading && importers.length === 0 && <div className='admin-log-empty'>No pending requests</div>}
                    {importers.map(imp => (
                        <div key={imp.user_id} className='join-request-row'>
                            <div className='join-request-info'>
                                <span className='join-request-id'>User {imp.user_id}</span>
                                {imp.about && <span className='join-request-about'>{imp.about}</span>}
                            </div>
                            <div className='join-request-actions'>
                                <button
                                    className='join-request-btn join-request-approve'
                                    disabled={processing.has(imp.user_id)}
                                    onClick={() => this.handleDecide(imp.user_id, true)}>
                                    <CheckIcon fontSize='small' />
                                </button>
                                <button
                                    className='join-request-btn join-request-reject'
                                    disabled={processing.has(imp.user_id)}
                                    onClick={() => this.handleDecide(imp.user_id, false)}>
                                    <CloseIcon fontSize='small' />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}

export default JoinRequests;
