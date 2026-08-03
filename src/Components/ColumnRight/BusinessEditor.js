import React from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import TdLibController from '../../Controllers/TdLibController';
import './BusinessEditor.css';

class BusinessEditor extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            saving: false,
            introTitle: '',
            introDesc: '',
            locationAddress: '',
            locationLat: '',
            locationLon: '',
            quickReplies: [],
            quickShortcut: '',
            quickMessage: '',
            connectedBots: [],
            botUsername: '',
            error: '',
        };
    }

    open(info) {
        this.setState(
            {
                open: true,
                saving: false,
                introTitle: info?.intro?.title || '',
                introDesc: info?.intro?.description || '',
                locationAddress: info?.location?.address || '',
                locationLat: info?.location?.location?.latitude != null ? String(info.location.location.latitude) : '',
                locationLon:
                    info?.location?.location?.longitude != null ? String(info.location.location.longitude) : '',
                error: '',
            },
            this.loadAutomation,
        );
    }

    loadAutomation = async () => {
        try {
            const [quick, bots] = await Promise.all([
                TdLibController.send({ '@type': 'getQuickReplies' }),
                TdLibController.send({ '@type': 'getBusinessConnectedBots' }),
            ]);
            this.setState({
                quickReplies: quick?.quick_reply_shortcuts || [],
                connectedBots: bots?.bots || [],
            });
        } catch (error) {
            this.setState({ error: error?.message || 'No se pudo cargar la automatización empresarial.' });
        }
    };

    handleClose = () => this.setState({ open: false });

    handleSaveIntro = async () => {
        this.setState({ saving: true });
        try {
            await TdLibController.send({
                '@type': 'updateBusinessIntro',
                title: this.state.introTitle,
                description: this.state.introDesc,
            });
        } catch {}
        this.setState({ saving: false });
        if (this.props.onSaved) this.props.onSaved();
    };

    handleSaveLocation = async () => {
        this.setState({ saving: true });
        try {
            await TdLibController.send({
                '@type': 'updateBusinessLocation',
                address: this.state.locationAddress,
                lat: this.state.locationLat ? parseFloat(this.state.locationLat) : null,
                lon: this.state.locationLon ? parseFloat(this.state.locationLon) : null,
            });
        } catch {}
        this.setState({ saving: false });
        if (this.props.onSaved) this.props.onSaved();
    };

    handleCreateQuickReply = async () => {
        const { quickShortcut, quickMessage } = this.state;
        if (!quickShortcut.trim() || !quickMessage.trim()) return;
        this.setState({ saving: true, error: '' });
        try {
            await TdLibController.send({
                '@type': 'createQuickReply',
                shortcut: quickShortcut,
                message: quickMessage,
            });
            this.setState({ quickShortcut: '', quickMessage: '' });
            await this.loadAutomation();
        } catch (error) {
            this.setState({ error: error?.message || 'No se pudo crear la respuesta rápida.' });
        }
        this.setState({ saving: false });
        if (this.props.onSaved) this.props.onSaved();
    };

    handleRenameQuickReply = async item => {
        const shortcut = window.prompt('Nuevo atajo', item.shortcut || '');
        if (!shortcut || shortcut === item.shortcut) return;
        this.setState({ saving: true, error: '' });
        try {
            await TdLibController.send({ '@type': 'editQuickReply', shortcut_id: item.id, shortcut });
            await this.loadAutomation();
        } catch (error) {
            this.setState({ error: error?.message || 'No se pudo renombrar la respuesta.' });
        }
        this.setState({ saving: false });
    };

    handleDeleteQuickReply = async item => {
        if (!window.confirm(`¿Eliminar /${item.shortcut}?`)) return;
        this.setState({ saving: true, error: '' });
        try {
            await TdLibController.send({ '@type': 'deleteQuickReply', shortcut_id: item.id });
            await this.loadAutomation();
        } catch (error) {
            this.setState({ error: error?.message || 'No se pudo eliminar la respuesta.' });
        }
        this.setState({ saving: false });
        if (this.props.onSaved) this.props.onSaved();
    };

    handleConnectBot = async () => {
        const bot = this.state.botUsername.trim();
        if (!bot) return;
        this.setState({ saving: true, error: '' });
        try {
            await TdLibController.send({ '@type': 'updateBusinessConnectedBot', bot, can_reply: true });
            this.setState({ botUsername: '' });
            await this.loadAutomation();
        } catch (error) {
            this.setState({ error: error?.message || 'No se pudo conectar el bot.' });
        }
        this.setState({ saving: false });
    };

    handleDisconnectBot = async item => {
        if (!window.confirm(`¿Desconectar ${item.name || item.username}?`)) return;
        this.setState({ saving: true, error: '' });
        try {
            await TdLibController.send({
                '@type': 'updateBusinessConnectedBot',
                bot: item.username ? `@${item.username}` : item.id,
                deleted: true,
            });
            await this.loadAutomation();
        } catch (error) {
            this.setState({ error: error?.message || 'No se pudo desconectar el bot.' });
        }
        this.setState({ saving: false });
    };

    render() {
        const {
            open,
            saving,
            introTitle,
            introDesc,
            locationAddress,
            locationLat,
            locationLon,
            quickReplies,
            quickShortcut,
            quickMessage,
            connectedBots,
            botUsername,
            error,
        } = this.state;
        if (!open) return null;

        return (
            <div className='business-editor-overlay'>
                <div className='business-editor-toolbar'>
                    <button className='business-editor-back' onClick={this.handleClose}>
                        <ArrowBackIcon />
                    </button>
                    <span className='business-editor-title'>Telegram Business</span>
                </div>
                <div className='business-editor-content'>
                    {error && (
                        <div className='business-text-block' role='alert'>
                            {error}
                        </div>
                    )}
                    <div className='business-editor-section'>
                        <div className='business-editor-section-header'>Intro</div>
                        <TextField
                            label='Title'
                            value={introTitle}
                            onChange={e => this.setState({ introTitle: e.target.value })}
                            fullWidth
                            variant='outlined'
                            size='small'
                            style={{ marginBottom: 12 }}
                        />
                        <TextField
                            label='Description'
                            value={introDesc}
                            onChange={e => this.setState({ introDesc: e.target.value })}
                            fullWidth
                            multiline
                            rows={3}
                            variant='outlined'
                            size='small'
                            style={{ marginBottom: 12 }}
                        />
                        <Button variant='contained' color='primary' disabled={saving} onClick={this.handleSaveIntro}>
                            Save Intro
                        </Button>
                    </div>
                    <div className='business-editor-section'>
                        <div className='business-editor-section-header'>Location</div>
                        <TextField
                            label='Address'
                            value={locationAddress}
                            onChange={e => this.setState({ locationAddress: e.target.value })}
                            fullWidth
                            variant='outlined'
                            size='small'
                            style={{ marginBottom: 12 }}
                        />
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                            <TextField
                                label='Latitude'
                                value={locationLat}
                                onChange={e => this.setState({ locationLat: e.target.value })}
                                variant='outlined'
                                size='small'
                                style={{ flex: 1 }}
                            />
                            <TextField
                                label='Longitude'
                                value={locationLon}
                                onChange={e => this.setState({ locationLon: e.target.value })}
                                variant='outlined'
                                size='small'
                                style={{ flex: 1 }}
                            />
                        </div>
                        <Button variant='contained' color='primary' disabled={saving} onClick={this.handleSaveLocation}>
                            Save Location
                        </Button>
                    </div>
                    <div className='business-editor-section'>
                        <div className='business-editor-section-header'>Respuestas rápidas</div>
                        <TextField
                            label='Atajo (por ejemplo, horario)'
                            value={quickShortcut}
                            onChange={e => this.setState({ quickShortcut: e.target.value.replace(/\s/g, '') })}
                            fullWidth
                            variant='outlined'
                            size='small'
                            style={{ marginBottom: 12 }}
                        />
                        <TextField
                            label='Mensaje'
                            value={quickMessage}
                            onChange={e => this.setState({ quickMessage: e.target.value })}
                            fullWidth
                            multiline
                            rows={3}
                            variant='outlined'
                            size='small'
                            style={{ marginBottom: 12 }}
                        />
                        <Button
                            variant='contained'
                            color='primary'
                            disabled={saving || !quickShortcut.trim() || !quickMessage.trim()}
                            onClick={this.handleCreateQuickReply}>
                            Crear respuesta
                        </Button>
                        <div className='business-quick-replies' style={{ marginTop: 12 }}>
                            {quickReplies.map(item => (
                                <div className='business-quick-reply' key={item.id}>
                                    <span className='business-quick-reply-shortcut'>/{item.shortcut}</span>
                                    <span>{item.count || 0} mensaje(s)</span>
                                    <Button
                                        size='small'
                                        disabled={saving}
                                        onClick={() => this.handleRenameQuickReply(item)}>
                                        Editar
                                    </Button>
                                    <Button
                                        size='small'
                                        disabled={saving}
                                        onClick={() => this.handleDeleteQuickReply(item)}>
                                        Eliminar
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className='business-editor-section'>
                        <div className='business-editor-section-header'>Bots empresariales conectados</div>
                        <TextField
                            label='@usuario del bot'
                            value={botUsername}
                            onChange={e => this.setState({ botUsername: e.target.value })}
                            fullWidth
                            variant='outlined'
                            size='small'
                            style={{ marginBottom: 12 }}
                        />
                        <Button
                            variant='contained'
                            color='primary'
                            disabled={saving || !botUsername.trim()}
                            onClick={this.handleConnectBot}>
                            Conectar bot
                        </Button>
                        <div className='business-quick-replies' style={{ marginTop: 12 }}>
                            {connectedBots.map(item => (
                                <div className='business-quick-reply' key={item.id}>
                                    <strong>{item.name}</strong>
                                    {item.username && <span>@{item.username}</span>}
                                    <span>{item.can_reply ? 'Puede responder' : 'Solo lectura'}</span>
                                    <Button
                                        size='small'
                                        disabled={saving}
                                        onClick={() => this.handleDisconnectBot(item)}>
                                        Desconectar
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default BusinessEditor;
