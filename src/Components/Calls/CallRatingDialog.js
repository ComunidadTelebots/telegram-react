import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';
import callController, { CallState } from '../../Controllers/CallController';
import TdLibController from '../../Controllers/TdLibController';
import './CallRatingDialog.css';

class CallRatingDialog extends Component {
    state = {
        open: false,
        rating: 5,
        comment: '',
        callId: null,
    };

    componentDidMount() {
        callController.on('stateChanged', this._onStateChanged);
    }

    componentWillUnmount() {
        callController.off('stateChanged', this._onStateChanged);
    }

    _onStateChanged = state => {
        if (state === CallState.ENDED) {
            const info = callController.callInfo;
            if (info && info.callId) {
                this.setState({ open: true, rating: 5, comment: '', callId: info.callId });
            }
        }
    };

    handleStar = n => this.setState({ rating: n });

    handleSkip = () => this.setState({ open: false });

    handleSend = async () => {
        const { callId, rating, comment } = this.state;
        this.setState({ open: false });
        if (!callId) return;
        try {
            await TdLibController.send({ '@type': 'setCallRating', call_id: callId, rating, comment });
        } catch (e) {}
    };

    render() {
        const { open, rating } = this.state;
        return (
            <Dialog open={open} onClose={this.handleSkip} maxWidth='xs' fullWidth>
                <DialogTitle>¿Cómo fue la llamada?</DialogTitle>
                <DialogContent>
                    <div className='call-rating-stars'>
                        {[1, 2, 3, 4, 5].map(n => (
                            <button
                                key={n}
                                className={`call-rating-star${n <= rating ? ' call-rating-star--on' : ''}`}
                                onClick={() => this.handleStar(n)}>
                                ★
                            </button>
                        ))}
                    </div>
                    {rating < 4 && (
                        <TextField
                            label='Comentario (opcional)'
                            multiline
                            rows={2}
                            fullWidth
                            variant='outlined'
                            margin='dense'
                            onChange={e => this.setState({ comment: e.target.value })}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleSkip} color='default'>
                        Omitir
                    </Button>
                    <Button onClick={this.handleSend} color='primary' variant='contained'>
                        Enviar
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default CallRatingDialog;
