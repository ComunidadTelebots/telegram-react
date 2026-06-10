/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import DeleteIcon from '@material-ui/icons/Delete';
import TdLibController from '../../Controllers/TdLibController';
import { getText } from '../../Utils/Message';

class ScheduledMessages extends React.Component {
    constructor(props) {
        super(props);
        this.state = { open: false, messages: [], loading: false, chatId: null };
    }

    open = async chatId => {
        this.setState({ open: true, loading: true, messages: [], chatId });
        try {
            const result = await TdLibController.send({
                '@type': 'getChatScheduledMessages',
                chat_id: chatId,
            });
            this.setState({ messages: result.messages || [], loading: false });
        } catch (e) {
            this.setState({ loading: false });
        }
    };

    handleClose = () => {
        this.setState({ open: false });
    };

    handleDelete = async message => {
        const { chatId } = this.state;
        await TdLibController.send({
            '@type': 'deleteChatScheduledMessages',
            chat_id: chatId,
            message_ids: [message.id],
        });
        this.setState(prev => ({ messages: prev.messages.filter(m => m.id !== message.id) }));
    };

    formatScheduleDate(message) {
        if (!message || !message.scheduling_state) return '';
        const { send_date } = message.scheduling_state;
        if (!send_date) return 'Al conectarse';
        return new Date(send_date * 1000).toLocaleString();
    }

    getPreview(message) {
        if (!message) return '';
        try {
            const text = getText(message);
            if (text) return text.substring(0, 80) + (text.length > 80 ? '…' : '');
        } catch (_) {}
        const type = message.content && message.content['@type'];
        const labels = {
            messagePhoto: '📷 Foto',
            messageVideo: '🎥 Vídeo',
            messageDocument: '📎 Archivo',
            messageVoiceNote: '🎤 Nota de voz',
            messageVideoNote: '📹 Nota de vídeo',
            messageSticker: '😀 Sticker',
            messageAnimation: '🎞 GIF',
            messageAudio: '🎵 Audio',
            messageLocation: '📍 Ubicación',
            messageContact: '👤 Contacto',
            messagePoll: '📊 Encuesta',
        };
        return labels[type] || type || '(mensaje)';
    }

    render() {
        const { open, messages, loading } = this.state;

        return (
            <Dialog open={open} onClose={this.handleClose} maxWidth='sm' fullWidth>
                <DialogTitle>Mensajes programados</DialogTitle>
                <DialogContent style={{ minHeight: 120 }}>
                    {loading && (
                        <div style={{ textAlign: 'center', padding: 24 }}>
                            <CircularProgress />
                        </div>
                    )}
                    {!loading && messages.length === 0 && (
                        <Typography color='textSecondary' style={{ padding: '8px 0' }}>
                            No hay mensajes programados.
                        </Typography>
                    )}
                    {!loading && messages.length > 0 && (
                        <List dense>
                            {messages.map(msg => (
                                <ListItem key={msg.id} divider>
                                    <ListItemText
                                        primary={this.getPreview(msg)}
                                        secondary={this.formatScheduleDate(msg)}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge='end'
                                            size='small'
                                            title='Eliminar mensaje programado'
                                            onClick={() => this.handleDelete(msg)}>
                                            <DeleteIcon fontSize='small' />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleClose} color='primary'>
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default ScheduledMessages;
