/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import AddIcon from '@material-ui/icons/Add';
import IconButton from '@material-ui/core/IconButton';
import CircularProgress from '@material-ui/core/CircularProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import TdLibController from '../../Controllers/TdLibController';
import './ForumTopicsList.css';

const ICON_COLORS = [0x6fb9f0, 0xffd67e, 0xcb86db, 0x8eee98, 0xff93b2, 0xfb6f5f];

class ForumTopicsList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            chatId: 0,
            chatTitle: '',
            topics: [],
            loading: false,
            createOpen: false,
            newTopicTitle: '',
            creating: false,
        };
    }

    open(chatId, chatTitle = '') {
        this.setState({ open: true, chatId, chatTitle, topics: [], loading: true, createOpen: false }, () => {
            this._load(chatId);
        });
    }

    close = () => this.setState({ open: false });

    _load = async chatId => {
        try {
            const result = await TdLibController.send({ '@type': 'getForumTopics', chat_id: chatId });
            this.setState({ topics: result.topics || [], loading: false });
        } catch (e) {
            console.error('[ForumTopicsList] load error', e);
            this.setState({ loading: false });
        }
    };

    handleTopicClick = topic => {
        const { chatId, chatTitle } = this.state;
        this.close();
        if (window._messageThreadRef) {
            window._messageThreadRef.open(chatId, topic.id, { topicId: topic.id, title: topic.title });
        }
    };

    handleOpenCreate = () => this.setState({ createOpen: true, newTopicTitle: '' });
    handleCloseCreate = () => this.setState({ createOpen: false });

    handleCreate = async () => {
        const { chatId, newTopicTitle } = this.state;
        if (!newTopicTitle.trim()) return;
        this.setState({ creating: true });
        try {
            await TdLibController.send({
                '@type': 'createForumTopic',
                chat_id: chatId,
                title: newTopicTitle.trim(),
                icon_color: ICON_COLORS[Math.floor(Math.random() * ICON_COLORS.length)],
            });
            this.setState({ createOpen: false, creating: false });
            this._load(chatId);
        } catch (e) {
            console.error('[ForumTopicsList] create error', e);
            this.setState({ creating: false });
        }
    };

    render() {
        const { open, chatTitle, topics, loading, createOpen, newTopicTitle, creating } = this.state;
        if (!open) return null;

        return (
            <>
                <div className='forum-topics-overlay' onClick={this.close}>
                    <div className='forum-topics-panel' onClick={e => e.stopPropagation()}>
                        <div className='forum-topics-header'>
                            <IconButton onClick={this.close} size='small'>
                                <ArrowBackIcon />
                            </IconButton>
                            <span className='forum-topics-title'>{chatTitle || 'Topics'}</span>
                            <IconButton
                                size='small'
                                className='forum-topics-add-btn'
                                title='Crear topic'
                                onClick={this.handleOpenCreate}>
                                <AddIcon />
                            </IconButton>
                        </div>

                        <div className='forum-topics-body'>
                            {loading && (
                                <div className='forum-topics-loading'>
                                    <CircularProgress size={28} />
                                </div>
                            )}

                            {!loading && topics.length === 0 && (
                                <div className='forum-topics-empty'>No hay topics aún.</div>
                            )}

                            {!loading &&
                                topics.map(topic => (
                                    <div
                                        key={topic.id}
                                        className='forum-topic-item'
                                        onClick={() => this.handleTopicClick(topic)}>
                                        <div
                                            className='forum-topic-icon'
                                            style={{
                                                background: topic.icon_color
                                                    ? `#${topic.icon_color.toString(16).padStart(6, '0')}`
                                                    : 'var(--color-accent-main)',
                                            }}>
                                            {topic.title ? topic.title[0].toUpperCase() : '#'}
                                        </div>
                                        <div className='forum-topic-info'>
                                            <div className='forum-topic-name'>
                                                {topic.is_pinned && (
                                                    <span className='forum-topic-pin' title='Fijado'>
                                                        📌{' '}
                                                    </span>
                                                )}
                                                {topic.title}
                                                {topic.is_closed && <span className='forum-topic-closed'> 🔒</span>}
                                            </div>
                                        </div>
                                        {topic.unread_count > 0 && (
                                            <div className='forum-topic-badge'>{topic.unread_count}</div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>

                <Dialog open={createOpen} onClose={this.handleCloseCreate} transitionDuration={0}>
                    <DialogTitle>Nuevo topic</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            label='Nombre del topic'
                            fullWidth
                            value={newTopicTitle}
                            onChange={e => this.setState({ newTopicTitle: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && this.handleCreate()}
                            inputProps={{ maxLength: 128 }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleCloseCreate} color='primary'>
                            Cancelar
                        </Button>
                        <Button
                            onClick={this.handleCreate}
                            color='primary'
                            disabled={creating || !newTopicTitle.trim()}>
                            Crear
                        </Button>
                    </DialogActions>
                </Dialog>
            </>
        );
    }
}

export default ForumTopicsList;
