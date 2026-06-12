import React, { Component } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import CircularProgress from '@material-ui/core/CircularProgress';
import UserTile from '../Tile/UserTile';
import UserStore from '../../Stores/UserStore';
import TdLibController from '../../Controllers/TdLibController';
import './SeenBy.css';

class SeenByAvatars extends Component {
    constructor(props) {
        super(props);
        this.state = { userIds: null };
    }

    componentDidMount() {
        this.load();
    }

    componentDidUpdate(prev) {
        if (prev.chatId !== this.props.chatId || prev.messageId !== this.props.messageId) {
            this.load();
        }
    }

    load = async () => {
        const { chatId, messageId } = this.props;
        try {
            const result = await TdLibController.send({
                '@type': 'getMessageReadParticipants',
                chat_id: chatId,
                message_id: messageId,
            });
            this.setState({ userIds: result.user_ids || [] });
        } catch {
            this.setState({ userIds: [] });
        }
    };

    render() {
        const { userIds } = this.state;
        if (!userIds || userIds.length === 0) return null;

        const preview = userIds.slice(0, 3);
        const extra = userIds.length - preview.length;

        return (
            <div className='seen-by-avatars' onClick={this.props.onOpen} title='Visto por'>
                {preview.map(uid => (
                    <span key={uid} className='seen-by-avatar'>
                        <UserTile userId={uid} small />
                    </span>
                ))}
                {extra > 0 && <span className='seen-by-extra'>+{extra}</span>}
            </div>
        );
    }
}

class SeenByModal extends Component {
    constructor(props) {
        super(props);
        this.state = { loading: false, userIds: [] };
    }

    componentDidUpdate(prev) {
        if (!prev.open && this.props.open) {
            this.load();
        }
    }

    load = async () => {
        const { chatId, messageId } = this.props;
        this.setState({ loading: true, userIds: [] });
        try {
            const result = await TdLibController.send({
                '@type': 'getMessageReadParticipants',
                chat_id: chatId,
                message_id: messageId,
            });
            this.setState({ loading: false, userIds: result.user_ids || [] });
        } catch {
            this.setState({ loading: false });
        }
    };

    render() {
        const { open, onClose } = this.props;
        const { loading, userIds } = this.state;

        return (
            <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
                <DialogTitle>Visto por</DialogTitle>
                <DialogContent style={{ padding: 0, minHeight: 80 }}>
                    {loading && (
                        <div className='seenby-loading'>
                            <CircularProgress size={28} />
                        </div>
                    )}
                    {!loading && userIds.length === 0 && (
                        <div className='seenby-empty'>Nadie ha leído el mensaje aún</div>
                    )}
                    <List dense>
                        {userIds.map(uid => {
                            const user = UserStore.get(uid);
                            const name = user
                                ? [user.first_name, user.last_name].filter(Boolean).join(' ')
                                : `Usuario ${uid}`;
                            return (
                                <ListItem key={uid}>
                                    <ListItemAvatar>
                                        <UserTile userId={uid} />
                                    </ListItemAvatar>
                                    <ListItemText primary={name} />
                                </ListItem>
                            );
                        })}
                    </List>
                </DialogContent>
            </Dialog>
        );
    }
}

class SeenBy extends Component {
    constructor(props) {
        super(props);
        this.state = { modalOpen: false };
    }

    render() {
        const { chatId, messageId } = this.props;
        const { modalOpen } = this.state;

        return (
            <>
                <SeenByAvatars
                    chatId={chatId}
                    messageId={messageId}
                    onOpen={() => this.setState({ modalOpen: true })}
                />
                <SeenByModal
                    open={modalOpen}
                    chatId={chatId}
                    messageId={messageId}
                    onClose={() => this.setState({ modalOpen: false })}
                />
            </>
        );
    }
}

export default SeenBy;
