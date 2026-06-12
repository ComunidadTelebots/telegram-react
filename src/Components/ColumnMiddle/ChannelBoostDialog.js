import React, { Component } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import LinearProgress from '@material-ui/core/LinearProgress';
import TdLibController from '../../Controllers/TdLibController';
import './ChannelBoostDialog.css';

class ChannelBoostDialog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            boosting: false,
            status: null,
            myBoosts: null,
            error: null,
            boosted: false,
        };
    }

    componentDidMount() {
        this.load();
    }

    load = async () => {
        const { chatId } = this.props;
        this.setState({ loading: true, error: null });
        try {
            const [status, myBoosts] = await Promise.all([
                TdLibController.send({ '@type': 'getBoostsStatus', chat_id: chatId }),
                TdLibController.send({ '@type': 'getMyBoosts' }),
            ]);
            this.setState({ status, myBoosts, loading: false });
        } catch (e) {
            this.setState({ error: 'No se pudo cargar el estado de boosts.', loading: false });
        }
    };

    handleBoost = async () => {
        const { chatId } = this.props;
        const { myBoosts } = this.state;
        this.setState({ boosting: true, error: null });
        try {
            // Usar slots libres o el slot 0
            const freeSlots = (myBoosts?.my_boosts || [])
                .filter(b => !b.peer || b.cooldown_until_date === 0)
                .map(b => b.slot);
            const slots = freeSlots.length > 0 ? [freeSlots[0]] : [0];
            const result = await TdLibController.send({ '@type': 'applyBoost', chat_id: chatId, slots });
            if (result.ok) {
                this.setState({ boosted: true, boosting: false });
                await this.load();
            } else {
                this.setState({ error: result.error || 'Error al boostear.', boosting: false });
            }
        } catch (e) {
            this.setState({ error: 'Error al boostear el canal.', boosting: false });
        }
    };

    render() {
        const { open, onClose } = this.props;
        const { loading, boosting, status, error, boosted } = this.state;

        const level = status?.level || 0;
        const current = status?.boost_count || 0;
        const next = status?.next_level_boost_count || 0;
        const progress = next > 0 ? Math.min(100, Math.round((current / next) * 100)) : 100;
        const boostUrl = status?.boost_url || '';

        return (
            <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
                <DialogTitle className='boost-dialog-title'>
                    <span className='boost-dialog-icon'>⚡</span>
                    Boostear canal
                </DialogTitle>
                <DialogContent>
                    {loading ? (
                        <div className='boost-dialog-loading'>
                            <CircularProgress size={32} />
                        </div>
                    ) : error ? (
                        <p className='boost-dialog-error'>{error}</p>
                    ) : (
                        <>
                            <div className='boost-level-row'>
                                <span className='boost-level-label'>Nivel {level}</span>
                                {next > 0 && <span className='boost-level-next'>→ Nivel {level + 1}</span>}
                            </div>
                            <LinearProgress variant='determinate' value={progress} className='boost-progress' />
                            <p className='boost-count-text'>
                                {current} / {next > 0 ? next : current} boosts
                            </p>
                            {boosted && <p className='boost-dialog-success'>¡Canal boosteado correctamente!</p>}
                            {boostUrl && (
                                <p className='boost-link-text'>
                                    <a href={boostUrl} target='_blank' rel='noopener noreferrer'>
                                        Compartir enlace de boost
                                    </a>
                                </p>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color='default'>
                        Cerrar
                    </Button>
                    {!loading && !error && (
                        <Button
                            onClick={this.handleBoost}
                            color='primary'
                            variant='contained'
                            disabled={boosting || boosted}>
                            {boosting ? <CircularProgress size={18} /> : boosted ? 'Boosteado ✓' : '⚡ Boostear'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        );
    }
}

export default ChannelBoostDialog;
