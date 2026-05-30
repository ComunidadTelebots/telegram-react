import React, { Component } from 'react';
import Dialog from '../Tile/Dialog';
import ChatStore from '../../Stores/ChatStore';
import TdLibController from '../../Controllers/TdLibController';

class FolderDialogsList extends Component {
    constructor(props) {
        super(props);
        this._isMounted = false;
        this.state = { chatIds: [] };
    }

    componentDidMount() {
        this._isMounted = true;
        this.load();
        ChatStore.on('updateChatLastMessage', this.onChatUpdate);
        ChatStore.on('updateChatOrder', this.onChatUpdate);
        ChatStore.on('updateChatDraftMessage', this.onChatUpdate);
        ChatStore.on('updateChatIsPinned', this.onChatUpdate);
        ChatStore.on('updateNewChat', this.onNewChat);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.filterId !== this.props.filterId) {
            this.load();
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
        ChatStore.off('updateChatLastMessage', this.onChatUpdate);
        ChatStore.off('updateChatOrder', this.onChatUpdate);
        ChatStore.off('updateChatDraftMessage', this.onChatUpdate);
        ChatStore.off('updateChatIsPinned', this.onChatUpdate);
        ChatStore.off('updateNewChat', this.onNewChat);
    }

    onNewChat = update => {
        const { chatIds } = this.state;
        if (chatIds.includes(update.chat.id)) {
            this.forceUpdate();
        }
    };

    onChatUpdate = update => {
        const { chatIds } = this.state;
        if (!update.chat_id || !chatIds.includes(update.chat_id)) return;
        // Re-sort by order descending
        const sorted = [...chatIds].sort((a, b) => {
            const ca = ChatStore.get(a);
            const cb = ChatStore.get(b);
            const oa = ca && ca.order ? ca.order : '0';
            const ob = cb && cb.order ? cb.order : '0';
            return ob > oa ? 1 : ob < oa ? -1 : 0;
        });
        if (this._isMounted) this.setState({ chatIds: sorted });
    };

    async load() {
        const { filterId } = this.props;
        try {
            const result = await TdLibController.send({
                '@type': 'getChats',
                chat_list: { '@type': 'chatListFilter', filter_id: filterId },
                limit: 200,
            });
            const ids = result.chat_ids || [];
            if (!this._isMounted) return;

            // Ensure each chat is in ChatStore; load missing ones
            const missing = ids.filter(id => !ChatStore.get(id));
            await Promise.all(
                missing.map(id => TdLibController.send({ '@type': 'getChat', chat_id: id }).catch(() => null)),
            );

            // Sort by chat order (most recent first)
            const sorted = [...ids].sort((a, b) => {
                const ca = ChatStore.get(a);
                const cb = ChatStore.get(b);
                const oa = ca && ca.order ? ca.order : '0';
                const ob = cb && cb.order ? cb.order : '0';
                return ob > oa ? 1 : ob < oa ? -1 : 0;
            });

            if (this._isMounted) this.setState({ chatIds: sorted });
        } catch (e) {
            console.warn('[FolderDialogsList] load error', e);
        }
    }

    render() {
        const { chatIds } = this.state;
        return (
            <div className='folder-dialogs-list'>
                {chatIds.map(id => (
                    <Dialog key={id} chatId={id} />
                ))}
            </div>
        );
    }
}

export default FolderDialogsList;
