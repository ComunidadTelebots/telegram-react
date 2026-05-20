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
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import DeleteIcon from '@material-ui/icons/Delete';
import TdLibController from '../../Controllers/TdLibController';
import './ActiveSessions.css';

class ActiveSessions extends React.Component {
    constructor(props) {
        super(props);
        this.state = { open: false, sessions: [], loading: false };
    }

    open = async () => {
        this.setState({ open: true, loading: true, sessions: [] });
        try {
            const result = await TdLibController.send({ '@type': 'getActiveSessions' });
            this.setState({ sessions: result.sessions || [], loading: false });
        } catch (e) {
            this.setState({ loading: false });
        }
    };

    handleClose = () => {
        this.setState({ open: false });
    };

    handleTerminate = async session => {
        await TdLibController.send({ '@type': 'terminateSession', session_id: session.id });
        this.setState(prev => ({ sessions: prev.sessions.filter(s => s.id !== session.id) }));
    };

    handleTerminateAll = async () => {
        await TdLibController.send({ '@type': 'terminateAllOtherSessions' });
        this.setState(prev => ({ sessions: prev.sessions.filter(s => s.is_current) }));
    };

    formatDate = timestamp => {
        if (!timestamp) return '';
        return new Date(timestamp * 1000).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    render() {
        const { open, sessions, loading } = this.state;

        const current = sessions.find(s => s.is_current);
        const others = sessions.filter(s => !s.is_current);

        return (
            <Dialog open={open} onClose={this.handleClose} maxWidth='sm' fullWidth>
                <DialogTitle>Active Sessions</DialogTitle>
                <DialogContent className='active-sessions-content'>
                    {loading && (
                        <div className='active-sessions-loading'>
                            <CircularProgress />
                        </div>
                    )}
                    {!loading && (
                        <List disablePadding>
                            {current && (
                                <>
                                    <Typography variant='caption' className='active-sessions-section-label'>
                                        Current session
                                    </Typography>
                                    <ListItem
                                        disableGutters
                                        className='active-sessions-item active-sessions-item--current'>
                                        <ListItemText
                                            primary={`${current.device_model} — ${current.app_name} ${current.app_version}`}
                                            secondary={`${current.platform} ${current.system_version} · ${
                                                current.country
                                            } · ${this.formatDate(current.date_active)}`}
                                        />
                                    </ListItem>
                                    {others.length > 0 && <Divider />}
                                </>
                            )}
                            {others.length > 0 && (
                                <Typography variant='caption' className='active-sessions-section-label'>
                                    Other sessions
                                </Typography>
                            )}
                            {others.map(session => (
                                <ListItem key={session.id} disableGutters className='active-sessions-item'>
                                    <ListItemText
                                        primary={`${session.device_model} — ${session.app_name} ${session.app_version}`}
                                        secondary={`${session.platform} ${session.system_version} · ${
                                            session.country
                                        } · ${this.formatDate(session.date_active)}`}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge='end'
                                            onClick={() => this.handleTerminate(session)}
                                            size='small'>
                                            <DeleteIcon fontSize='small' />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                            {!loading && sessions.length === 0 && (
                                <ListItem>
                                    <ListItemText primary='No sessions found' />
                                </ListItem>
                            )}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    {others.length > 0 && (
                        <Button color='secondary' onClick={this.handleTerminateAll}>
                            Terminate all other sessions
                        </Button>
                    )}
                    <Button color='primary' onClick={this.handleClose}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default ActiveSessions;
