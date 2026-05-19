/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import CircularProgress from '@material-ui/core/CircularProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import TextField from '@material-ui/core/TextField';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import SearchIcon from '@material-ui/icons/Search';
import { getUserFullName } from '../../Utils/User';
import TdLibController from '../../Controllers/TdLibController';

class NewGroupDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            step: 'select',
            contacts: [],
            loading: true,
            selected: new Set(),
            search: '',
            groupName: '',
            creating: false,
            error: null
        };
    }

    componentDidMount() {
        if (this.props.open) {
            this.loadContacts();
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.open && !prevProps.open) {
            this.setState({
                step: 'select',
                contacts: [],
                loading: true,
                selected: new Set(),
                search: '',
                groupName: '',
                creating: false,
                error: null
            });
            this.loadContacts();
        }
    }

    loadContacts = async () => {
        try {
            const contacts = await TdLibController.send({ '@type': 'getContacts' });
            this.setState({ contacts: contacts || [], loading: false });
        } catch (e) {
            this.setState({ loading: false });
        }
    };

    handleToggle = userId => {
        const selected = new Set(this.state.selected);
        if (selected.has(userId)) {
            selected.delete(userId);
        } else {
            selected.add(userId);
        }
        this.setState({ selected });
    };

    handleNext = () => {
        if (this.state.selected.size === 0) return;
        this.setState({ step: 'name', error: null });
    };

    handleBack = () => {
        this.setState({ step: 'select', error: null });
    };

    handleCreate = async () => {
        const { groupName, selected } = this.state;
        const name = groupName.trim();
        if (!name) {
            this.setState({ error: 'Ingresa un nombre para el grupo' });
            return;
        }
        this.setState({ creating: true, error: null });
        try {
            const chat = await TdLibController.send({
                '@type': 'createGroupChat',
                title: name,
                user_ids: Array.from(selected)
            });
            if (chat) {
                TdLibController.setChatId(chat.id);
            }
            this.props.onClose();
        } catch (e) {
            this.setState({ creating: false, error: e.message || 'Error al crear el grupo' });
        }
    };

    getInitials(user) {
        const name = getUserFullName(user) || '';
        return name
            .split(' ')
            .map(w => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    }

    render() {
        const { open, onClose } = this.props;
        const { step, contacts, loading, selected, search, groupName, creating, error } = this.state;

        const filtered = contacts.filter(u => {
            if (!search) return true;
            const name = getUserFullName(u) || '';
            return name.toLowerCase().includes(search.toLowerCase());
        });

        return (
            <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
                {step === 'select' ? (
                    <>
                        <DialogTitle>Nuevo grupo</DialogTitle>
                        <DialogContent style={{ padding: '0 8px' }}>
                            <TextField
                                fullWidth
                                placeholder='Buscar contactos'
                                value={search}
                                onChange={e => this.setState({ search: e.target.value })}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position='start'>
                                            <SearchIcon fontSize='small' />
                                        </InputAdornment>
                                    )
                                }}
                                style={{ margin: '8px 8px 4px' }}
                            />
                            {loading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                                    <CircularProgress />
                                </div>
                            ) : (
                                <List dense style={{ maxHeight: 340, overflowY: 'auto' }}>
                                    {filtered.map(u => (
                                        <ListItem key={u.id} button onClick={() => this.handleToggle(u.id)}>
                                            <ListItemAvatar>
                                                <Avatar style={{ width: 36, height: 36, fontSize: 14 }}>
                                                    {this.getInitials(u)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={getUserFullName(u)}
                                                secondary={u.username ? `@${u.username}` : ''}
                                            />
                                            <ListItemSecondaryAction>
                                                <Checkbox
                                                    edge='end'
                                                    color='primary'
                                                    checked={selected.has(u.id)}
                                                    onChange={() => this.handleToggle(u.id)}
                                                />
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                    {filtered.length === 0 && (
                                        <ListItem>
                                            <ListItemText secondary='Sin resultados' />
                                        </ListItem>
                                    )}
                                </List>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={onClose}>Cancelar</Button>
                            <Button
                                color='primary'
                                variant='contained'
                                disableElevation
                                disabled={selected.size === 0}
                                onClick={this.handleNext}>
                                Siguiente ({selected.size})
                            </Button>
                        </DialogActions>
                    </>
                ) : (
                    <>
                        <DialogTitle>
                            <IconButton size='small' onClick={this.handleBack} style={{ marginRight: 8 }}>
                                <ArrowBackIcon />
                            </IconButton>
                            Nombre del grupo
                        </DialogTitle>
                        <DialogContent>
                            <TextField
                                fullWidth
                                autoFocus
                                label='Nombre del grupo'
                                value={groupName}
                                onChange={e => this.setState({ groupName: e.target.value })}
                                error={Boolean(error)}
                                helperText={
                                    error ||
                                    `${selected.size} miembro${selected.size !== 1 ? 's' : ''} seleccionado${
                                        selected.size !== 1 ? 's' : ''
                                    }`
                                }
                                onKeyPress={e => e.key === 'Enter' && this.handleCreate()}
                                style={{ marginTop: 8 }}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={onClose}>Cancelar</Button>
                            <Button
                                color='primary'
                                variant='contained'
                                disableElevation
                                disabled={creating || !groupName.trim()}
                                onClick={this.handleCreate}>
                                {creating ? <CircularProgress size={20} /> : 'Crear grupo'}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        );
    }
}

export default NewGroupDialog;
