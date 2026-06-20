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
import TdLibController from '../../Controllers/TdLibController';
import './ReactorsModal.css';

class ReactorsModal extends Component {
    constructor(props) {
        super(props);
        this.state = { loading: false, reactors: [] };
    }

    componentDidUpdate(prev) {
        if (!prev.open && this.props.open) {
            this.load();
        }
    }

    load = async () => {
        const { chatId, messageId, reaction } = this.props;
        this.setState({ loading: true, reactors: [] });
        try {
            const result = await TdLibController.send({
                '@type': 'getMessageReactors',
                chat_id: chatId,
                message_id: messageId,
                reaction,
            });
            this.setState({ reactors: result.reactors || [], loading: false });
        } catch {
            this.setState({ loading: false });
        }
    };

    render() {
        const { open, onClose, reaction } = this.props;
        const { loading, reactors } = this.state;

        const isPaid = reaction === 'paid';
        const title = isPaid ? '⭐ Paid Reactions' : reaction ? `${reaction} Reactions` : 'Reactions';

        return (
            <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
                <DialogTitle>{title}</DialogTitle>
                <DialogContent style={{ padding: 0, minHeight: 120 }}>
                    {loading && (
                        <div className='reactors-loading'>
                            <CircularProgress size={28} />
                        </div>
                    )}
                    {!loading && reactors.length === 0 && <div className='reactors-empty'>Sin resultados</div>}
                    <List dense>
                        {reactors.map((r, i) => (
                            <ListItem key={i}>
                                <ListItemAvatar>
                                    <UserTile userId={r.sender_id?.user_id || 0} />
                                </ListItemAvatar>
                                <ListItemText
                                    primary={r.sender_name || ''}
                                    secondary={isPaid && r.star_count ? `⭐ ${r.star_count}` : r.reaction || ''}
                                />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
            </Dialog>
        );
    }
}

export default ReactorsModal;
