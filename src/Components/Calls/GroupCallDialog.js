import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import CircularProgress from '@material-ui/core/CircularProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import TextField from '@material-ui/core/TextField';
import TdLibController from '../../Controllers/TdLibController';

const initialState = {
    loading: false,
    saving: false,
    error: '',
    call: null,
    title: '',
    scheduleDate: '',
    inviteUsers: '',
    recordingTitle: '',
    recordVideo: false,
};

class GroupCallDialog extends React.PureComponent {
    state = initialState;

    componentDidUpdate(prevProps) {
        if (this.props.open && (!prevProps.open || prevProps.chatId !== this.props.chatId)) this.load();
        if (!this.props.open && prevProps.open) this.setState(initialState);
    }

    callParams = () => ({
        call_id: this.state.call.call_id,
        access_hash: this.state.call.access_hash,
    });

    load = async () => {
        this.setState({ loading: true, error: '' });
        try {
            const call = await TdLibController.send({
                '@type': 'getGroupCallInfo',
                chat_id: this.props.chatId,
                limit: 100,
            });
            this.setState({ call, title: call?.title || '', loading: false });
        } catch (error) {
            this.setState({ loading: false, error: error?.message || 'No se pudo consultar el chat de voz.' });
        }
    };

    run = async (request, reload = true) => {
        this.setState({ saving: true, error: '' });
        try {
            const result = await TdLibController.send(request);
            if (reload) await this.load();
            this.setState({ saving: false });
            return result;
        } catch (error) {
            this.setState({ saving: false, error: error?.message || 'Telegram rechazó la operación.' });
            return null;
        }
    };

    create = () => {
        const date = this.state.scheduleDate ? Math.floor(new Date(this.state.scheduleDate).getTime() / 1000) : 0;
        this.run({
            '@type': 'createGroupCall',
            chat_id: this.props.chatId,
            title: this.state.title,
            schedule_date: Number.isFinite(date) ? date : 0,
        });
    };

    editTitle = () => this.run({ '@type': 'editGroupCallTitle', ...this.callParams(), title: this.state.title });

    toggleJoinMuted = event =>
        this.run({
            '@type': 'toggleGroupCallJoinMuted',
            ...this.callParams(),
            join_muted: event.target.checked,
        });

    copyInvite = async () => {
        const result = await this.run({ '@type': 'exportGroupCallInvite', ...this.callParams() }, false);
        if (!result?.link) return;
        try {
            await navigator.clipboard.writeText(result.link);
        } catch (_) {
            window.prompt('Enlace del chat de voz', result.link);
        }
    };

    discard = () => {
        if (!window.confirm('¿Finalizar este chat de voz para todos?')) return;
        this.run({ '@type': 'discardGroupCall', ...this.callParams() });
    };

    invite = async () => {
        const users = this.state.inviteUsers
            .split(/[\s,;]+/)
            .map(value => value.trim())
            .filter(Boolean);
        if (!users.length) return;
        const result = await this.run({ '@type': 'inviteToGroupCall', ...this.callParams(), users }, false);
        if (result) this.setState({ inviteUsers: '' });
    };

    toggleRecording = () =>
        this.run({
            '@type': 'toggleGroupCallRecord',
            ...this.callParams(),
            start: !this.state.call.record_start_date,
            video: this.state.recordVideo,
            title: this.state.recordingTitle,
        });

    subscribeScheduled = () =>
        this.run({ '@type': 'subscribeScheduledGroupCall', ...this.callParams(), subscribed: true }, false);

    toggleParticipantMute = participant =>
        this.run({
            '@type': 'editGroupCallParticipant',
            ...this.callParams(),
            participant: participant.id,
            muted: !participant.muted,
        });

    renderCreate() {
        const { saving, title, scheduleDate } = this.state;
        return (
            <>
                <DialogContentText>
                    No hay un chat de voz activo. Puedes iniciarlo ahora o programarlo.
                </DialogContentText>
                <TextField
                    label='Título (opcional)'
                    value={title}
                    onChange={event => this.setState({ title: event.target.value })}
                    fullWidth
                    margin='dense'
                />
                <TextField
                    label='Programar para'
                    type='datetime-local'
                    value={scheduleDate}
                    onChange={event => this.setState({ scheduleDate: event.target.value })}
                    fullWidth
                    margin='dense'
                    InputLabelProps={{ shrink: true }}
                />
                <Button color='primary' variant='contained' disabled={saving} onClick={this.create}>
                    {scheduleDate ? 'Programar chat de voz' : 'Iniciar chat de voz'}
                </Button>
            </>
        );
    }

    renderActive() {
        const { call, saving, title, inviteUsers, recordingTitle, recordVideo } = this.state;
        const canManage = call.can_change_join_muted;
        return (
            <>
                <DialogContentText>
                    {call.scheduled
                        ? `Programado para ${new Date(call.schedule_date * 1000).toLocaleString()}`
                        : `${call.participants_count} participante(s)`}
                </DialogContentText>
                <TextField
                    label='Título'
                    value={title}
                    onChange={event => this.setState({ title: event.target.value })}
                    fullWidth
                    margin='dense'
                />
                {canManage && (
                    <Button color='primary' disabled={saving || title === call.title} onClick={this.editTitle}>
                        Guardar título
                    </Button>
                )}
                {call.can_change_join_muted && (
                    <FormControlLabel
                        control={<Checkbox checked={call.join_muted} onChange={this.toggleJoinMuted} color='primary' />}
                        label='Los nuevos participantes entran silenciados'
                    />
                )}
                {call.scheduled && canManage && (
                    <Button
                        color='primary'
                        variant='contained'
                        disabled={saving}
                        onClick={() => this.run({ '@type': 'startScheduledGroupCall', ...this.callParams() })}>
                        Iniciar ahora
                    </Button>
                )}
                {call.scheduled && (
                    <Button color='primary' disabled={saving} onClick={this.subscribeScheduled}>
                        Avisarme cuando empiece
                    </Button>
                )}
                <TextField
                    label='Invitar usuarios (@usuario o ID, separados por comas)'
                    value={inviteUsers}
                    onChange={event => this.setState({ inviteUsers: event.target.value })}
                    fullWidth
                    margin='dense'
                />
                <Button color='primary' disabled={saving || !inviteUsers.trim()} onClick={this.invite}>
                    Invitar participantes
                </Button>
                {!call.scheduled && canManage && (
                    <>
                        {!call.record_start_date && (
                            <TextField
                                label='Título de la grabación (opcional)'
                                value={recordingTitle}
                                onChange={event => this.setState({ recordingTitle: event.target.value })}
                                fullWidth
                                margin='dense'
                            />
                        )}
                        {!call.record_start_date && (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={recordVideo}
                                        onChange={event => this.setState({ recordVideo: event.target.checked })}
                                        color='primary'
                                    />
                                }
                                label='Incluir vídeo en la grabación'
                            />
                        )}
                        <Button color='primary' disabled={saving} onClick={this.toggleRecording}>
                            {call.record_start_date ? 'Detener grabación' : 'Iniciar grabación'}
                        </Button>
                    </>
                )}
                <List dense>
                    {(call.participants || []).map(participant => (
                        <ListItem key={`${participant.id}-${participant.username}`}>
                            <ListItemText
                                primary={participant.name}
                                secondary={[
                                    participant.username ? `@${participant.username}` : '',
                                    participant.muted ? 'silenciado' : 'hablando',
                                    participant.video_joined ? 'vídeo activo' : '',
                                    participant.raised_hand ? 'mano levantada' : '',
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            />
                            {canManage && (
                                <Button
                                    size='small'
                                    disabled={saving || !participant.id}
                                    onClick={() => this.toggleParticipantMute(participant)}>
                                    {participant.muted ? 'Permitir hablar' : 'Silenciar'}
                                </Button>
                            )}
                        </ListItem>
                    ))}
                </List>
                <DialogContentText>
                    La administración funciona aquí. La conexión de audio grupal requiere el transporte nativo tgcalls y
                    todavía debe realizarse desde una aplicación oficial de Telegram.
                </DialogContentText>
            </>
        );
    }

    render() {
        const { open, onClose } = this.props;
        const { loading, saving, error, call } = this.state;
        return (
            <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm' aria-labelledby='group-call-title'>
                <DialogTitle id='group-call-title'>Chat de voz</DialogTitle>
                <DialogContent>
                    {loading ? (
                        <CircularProgress size={28} />
                    ) : call?.active ? (
                        this.renderActive()
                    ) : (
                        this.renderCreate()
                    )}
                    {error && <DialogContentText color='error'>{error}</DialogContentText>}
                </DialogContent>
                <DialogActions>
                    {call?.active && (
                        <Button disabled={saving} onClick={this.copyInvite}>
                            Copiar invitación
                        </Button>
                    )}
                    {call?.active && call.can_change_join_muted && (
                        <Button disabled={saving} color='secondary' onClick={this.discard}>
                            Finalizar
                        </Button>
                    )}
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        );
    }
}

GroupCallDialog.propTypes = {
    chatId: PropTypes.number.isRequired,
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default GroupCallDialog;
