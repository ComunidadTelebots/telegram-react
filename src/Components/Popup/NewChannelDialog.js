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
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import TdLibController from '../../Controllers/TdLibController';

class NewChannelDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '',
            about: '',
            isBroadcast: true,
            creating: false,
            error: null
        };
    }

    handleCreate = async () => {
        const { title, about, isBroadcast } = this.state;
        const name = title.trim();
        if (!name) {
            this.setState({ error: 'Ingresa un nombre' });
            return;
        }
        this.setState({ creating: true, error: null });
        try {
            const chat = await TdLibController.send({
                '@type': 'createChannel',
                title: name,
                about: about.trim(),
                is_channel: isBroadcast
            });
            if (chat) {
                TdLibController.setChatId(chat.id);
            }
            this.props.onClose();
        } catch (e) {
            this.setState({ creating: false, error: e.message || 'Error al crear' });
        }
    };

    render() {
        const { open, onClose } = this.props;
        const { title, about, isBroadcast, creating, error } = this.state;

        return (
            <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
                <DialogTitle>{isBroadcast ? 'Nuevo canal' : 'Nuevo supergrupo'}</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        autoFocus
                        label={isBroadcast ? 'Nombre del canal' : 'Nombre del supergrupo'}
                        value={title}
                        onChange={e => this.setState({ title: e.target.value, error: null })}
                        error={Boolean(error)}
                        helperText={error}
                        style={{ marginBottom: 16 }}
                    />
                    <TextField
                        fullWidth
                        label='Descripción (opcional)'
                        value={about}
                        onChange={e => this.setState({ about: e.target.value })}
                        multiline
                        rows={2}
                        style={{ marginBottom: 16 }}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                color='primary'
                                checked={isBroadcast}
                                onChange={e => this.setState({ isBroadcast: e.target.checked })}
                            />
                        }
                        label={
                            <span>
                                <strong>{isBroadcast ? 'Canal' : 'Supergrupo'}</strong>
                                <Typography variant='caption' display='block' color='textSecondary'>
                                    {isBroadcast
                                        ? 'Solo los admins pueden publicar'
                                        : 'Todos los miembros pueden escribir'}
                                </Typography>
                            </span>
                        }
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button
                        color='primary'
                        variant='contained'
                        disableElevation
                        disabled={creating || !title.trim()}
                        onClick={this.handleCreate}>
                        {creating ? <CircularProgress size={20} /> : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default NewChannelDialog;
