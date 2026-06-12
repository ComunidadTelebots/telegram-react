import React, { Component } from 'react';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import ArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import ArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import TdLibController from '../../Controllers/TdLibController';
import './ChatSearch.css';

class ChatSearch extends Component {
    constructor(props) {
        super(props);
        this.state = { query: '', results: [], index: -1, total: 0, loading: false };
        this.debounce = null;
    }

    componentDidMount() {
        this.inputRef && this.inputRef.focus();
    }

    search = async query => {
        if (!query.trim()) {
            this.setState({ results: [], index: -1, total: 0 });
            return;
        }
        const { chatId } = this.props;
        this.setState({ loading: true });
        try {
            const result = await TdLibController.send({
                '@type': 'searchChatMessages',
                chat_id: chatId,
                query,
                sender_id: null,
                from_message_id: 0,
                offset: 0,
                limit: 100,
                filter: null,
                message_thread_id: 0,
            });
            const ids = (result.messages || []).map(m => m.id);
            this.setState({ results: ids, total: result.total_count || ids.length, loading: false });
            if (ids.length > 0) this.jumpTo(0, ids);
        } catch {
            this.setState({ loading: false });
        }
    };

    jumpTo = (idx, results) => {
        const list = results || this.state.results;
        if (!list.length) return;
        const clamp = Math.max(0, Math.min(idx, list.length - 1));
        this.setState({ index: clamp });
        const { chatId } = this.props;
        TdLibController.clientUpdate({
            '@type': 'clientUpdateMessageHighlighted',
            chatId,
            messageId: list[clamp],
        });
        import('../../Actions/Client').then(({ highlightMessage }) => highlightMessage(chatId, list[clamp]));
    };

    handleQueryChange = e => {
        const query = e.target.value;
        this.setState({ query });
        clearTimeout(this.debounce);
        this.debounce = setTimeout(() => this.search(query), 300);
    };

    handlePrev = () => {
        const { index, results } = this.state;
        this.jumpTo(index + 1, results);
    };

    handleNext = () => {
        const { index, results } = this.state;
        this.jumpTo(index - 1, results);
    };

    render() {
        const { onClose } = this.props;
        const { query, results, index, total, loading } = this.state;

        const current = results.length > 0 ? index + 1 : 0;
        const count = total > 0 ? total : results.length;

        return (
            <div className='chat-search-bar'>
                <input
                    ref={r => (this.inputRef = r)}
                    className='chat-search-input'
                    placeholder='Buscar en este chat...'
                    value={query}
                    onChange={this.handleQueryChange}
                    autoFocus
                />
                {query.length > 0 && (
                    <span className='chat-search-count'>
                        {loading ? '…' : count === 0 ? 'Sin resultados' : `${current}/${count}`}
                    </span>
                )}
                <IconButton
                    size='small'
                    onClick={this.handlePrev}
                    disabled={!results.length || index >= results.length - 1}>
                    <ArrowUpIcon fontSize='small' />
                </IconButton>
                <IconButton size='small' onClick={this.handleNext} disabled={!results.length || index <= 0}>
                    <ArrowDownIcon fontSize='small' />
                </IconButton>
                <IconButton size='small' onClick={onClose}>
                    <CloseIcon fontSize='small' />
                </IconButton>
            </div>
        );
    }
}

export default ChatSearch;
