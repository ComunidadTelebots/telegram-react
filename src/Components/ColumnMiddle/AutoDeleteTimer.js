import React, { Component } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Radio from '@material-ui/core/Radio';
import TdLibController from '../../Controllers/TdLibController';
import AppStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import './AutoDeleteTimer.css';

const OPTIONS = [
    { label: 'Desactivado', seconds: 0 },
    { label: '1 día', seconds: 86400 },
    { label: '1 semana', seconds: 604800 },
    { label: '1 mes', seconds: 2592000 },
    { label: '3 meses', seconds: 7776000 },
];

class AutoDeleteTimer extends Component {
    constructor(props) {
        super(props);
        this.state = { open: false, selected: 0, defaultSelected: 0, loadingDefault: false, saving: false };
    }

    open = async () => {
        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        const current = chat?.message_auto_delete_time || 0;
        const option = OPTIONS.find(o => o.seconds === current);
        this.setState({ open: true, selected: option ? current : 0, loadingDefault: true });

        try {
            const result = await TdLibController.send({ '@type': 'getDefaultMessageAutoDeleteTime' });
            const defaultTime = result?.message_auto_delete_time || 0;
            const defaultOption = OPTIONS.find(o => o.seconds === defaultTime);
            this.setState({ defaultSelected: defaultOption ? defaultTime : 0, loadingDefault: false });
        } catch (e) {
            console.warn('[AutoDeleteTimer] default ttl error', e);
            this.setState({ loadingDefault: false });
        }
    };

    close = () => this.setState({ open: false });

    handleSelect = seconds => this.setState({ selected: seconds });

    handleDefaultSelect = seconds => this.setState({ defaultSelected: seconds });

    handleSave = async () => {
        const { selected, defaultSelected } = this.state;
        const chatId = AppStore.getChatId();
        this.setState({ saving: true });
        try {
            await TdLibController.send({
                '@type': 'setChatMessageAutoDeleteTime',
                chat_id: chatId,
                message_auto_delete_time: selected,
            });
            await TdLibController.send({
                '@type': 'setDefaultMessageAutoDeleteTime',
                message_auto_delete_time: defaultSelected,
            });
        } catch (e) {
            console.warn('[AutoDeleteTimer] error', e);
        }
        this.setState({ saving: false, open: false });
    };

    render() {
        const { open, selected, defaultSelected, loadingDefault, saving } = this.state;

        return (
            <Dialog open={open} onClose={this.close} maxWidth='xs' fullWidth>
                <DialogTitle>Borrado automático de mensajes</DialogTitle>
                <DialogContent style={{ padding: 0 }}>
                    <p className='auto-delete-desc'>
                        Los mensajes en este chat se borrarán automáticamente después del tiempo seleccionado.
                    </p>
                    <div className='auto-delete-section-title'>Este chat</div>
                    <List dense>
                        {OPTIONS.map(({ label, seconds }) => (
                            <ListItem key={seconds} button onClick={() => this.handleSelect(seconds)}>
                                <ListItemText primary={label} />
                                <ListItemSecondaryAction>
                                    <Radio
                                        checked={selected === seconds}
                                        onChange={() => this.handleSelect(seconds)}
                                        color='primary'
                                    />
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                    <div className='auto-delete-section-title'>Predeterminado para nuevos chats</div>
                    <List dense>
                        {OPTIONS.map(({ label, seconds }) => (
                            <ListItem
                                key={seconds}
                                button
                                disabled={loadingDefault}
                                onClick={() => this.handleDefaultSelect(seconds)}>
                                <ListItemText primary={label} />
                                <ListItemSecondaryAction>
                                    <Radio
                                        checked={defaultSelected === seconds}
                                        onChange={() => this.handleDefaultSelect(seconds)}
                                        disabled={loadingDefault}
                                        color='primary'
                                    />
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.close} color='default'>
                        Cancelar
                    </Button>
                    <Button onClick={this.handleSave} color='primary' disabled={saving}>
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default AutoDeleteTimer;
