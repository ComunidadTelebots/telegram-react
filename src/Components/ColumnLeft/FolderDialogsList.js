import React, { Component } from 'react';
import Dialog from '../Tile/Dialog';
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
    }

    componentDidUpdate(prevProps) {
        if (prevProps.filterId !== this.props.filterId) {
            this.load();
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    async load() {
        const { filterId } = this.props;
        try {
            const result = await TdLibController.send({
                '@type': 'getChats',
                chat_list: { '@type': 'chatListFilter', filter_id: filterId },
                limit: 200
            });
            if (this._isMounted) {
                this.setState({ chatIds: result.chat_ids || [] });
            }
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
