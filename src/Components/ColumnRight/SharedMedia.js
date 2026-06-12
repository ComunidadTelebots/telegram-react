/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import SharedMediaHeaderControl from './SharedMediaHeaderControl';
import './SharedMedia.css';
import PropTypes from 'prop-types';
import GroupsInCommon from './GroupsInCommon';
import TdLibController from '../../Controllers/TdLibController';
import FileStore from '../../Stores/FileStore';
import MessageStore from '../../Stores/MessageStore';
import { getSrc } from '../../Utils/File';

const FILTER_TYPES = {
    media: 'searchMessagesFilterPhotoAndVideo',
    docs: 'searchMessagesFilterDocument',
    links: 'searchMessagesFilterUrl',
    audio: 'searchMessagesFilterAudio',
    voice: 'searchMessagesFilterVoiceNote',
};

class SharedMediaTab extends React.Component {
    constructor(props) {
        super(props);
        this.state = { messages: [], loading: false, hasMore: true, fromMessageId: 0 };
    }

    componentDidMount() {
        this.load();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.chatId !== this.props.chatId || prevProps.filter !== this.props.filter) {
            this.setState({ messages: [], loading: false, hasMore: true, fromMessageId: 0 }, () => this.load());
        }
    }

    load = async () => {
        const { chatId, filter } = this.props;
        const { fromMessageId, loading, hasMore } = this.state;
        if (loading || !hasMore) return;
        this.setState({ loading: true });
        try {
            const result = await TdLibController.send({
                '@type': 'searchChatMessages',
                chat_id: chatId,
                query: '',
                sender_id: null,
                from_message_id: fromMessageId,
                offset: 0,
                limit: 40,
                filter: { '@type': filter },
            });
            const msgs = result?.messages || [];
            this.setState(prev => ({
                messages: [...prev.messages, ...msgs],
                hasMore: msgs.length === 40,
                fromMessageId: msgs.length > 0 ? msgs[msgs.length - 1].id : prev.fromMessageId,
                loading: false,
            }));
        } catch {
            this.setState({ loading: false, hasMore: false });
        }
    };

    render() {
        const { filter } = this.props;
        const { messages, loading } = this.state;

        if (!messages.length && !loading) {
            return <div className='shared-media-empty'>Sin contenido</div>;
        }

        if (filter === FILTER_TYPES.media) {
            return (
                <div className='shared-media-grid' onScroll={this.handleScroll}>
                    {messages.map(msg => {
                        const content = msg.content;
                        const photo = content?.photo || content?.video?.thumbnail;
                        if (!photo) return null;
                        const photoSize = photo.sizes ? photo.sizes[photo.sizes.length - 1] : photo;
                        const src = getSrc(photoSize?.photo || photoSize);
                        if (!src) return null;
                        return (
                            <div key={msg.id} className='shared-media-grid-item'>
                                <img src={src} alt='' className='shared-media-grid-img' />
                            </div>
                        );
                    })}
                    {loading && (
                        <div className='shared-media-loading'>
                            <CircularProgress size={24} />
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className='shared-media-list' onScroll={this.handleScroll}>
                {messages.map(msg => {
                    const content = msg.content;
                    let primary = '';
                    let secondary = '';

                    if (filter === FILTER_TYPES.docs) {
                        primary = content?.document?.file_name || 'Documento';
                        secondary = `${((content?.document?.document?.size || 0) / 1024).toFixed(0)} KB`;
                    } else if (filter === FILTER_TYPES.links) {
                        const entities = content?.text?.entities || content?.caption?.entities || [];
                        const urlEnt = entities.find(
                            e =>
                                e.type?.['@type'] === 'textEntityTypeUrl' ||
                                e.type?.['@type'] === 'textEntityTypeTextUrl',
                        );
                        const txt = content?.text?.text || content?.caption?.text || '';
                        primary = urlEnt
                            ? txt.slice(urlEnt.offset, urlEnt.offset + urlEnt.length)
                            : txt.substring(0, 60);
                        secondary = content?.web_page?.site_name || '';
                    } else if (filter === FILTER_TYPES.audio) {
                        primary = content?.audio?.title || content?.audio?.file_name || 'Audio';
                        secondary = content?.audio?.performer || '';
                    } else if (filter === FILTER_TYPES.voice) {
                        const dur = content?.voice_note?.duration || 0;
                        primary = `Mensaje de voz — ${dur}s`;
                        secondary = new Date(msg.date * 1000).toLocaleDateString();
                    }

                    return (
                        <div key={msg.id} className='shared-media-list-item'>
                            <Typography variant='body2' className='shared-media-list-primary' noWrap>
                                {primary}
                            </Typography>
                            {secondary && (
                                <Typography variant='caption' color='textSecondary' noWrap>
                                    {secondary}
                                </Typography>
                            )}
                        </div>
                    );
                })}
                {loading && (
                    <div className='shared-media-loading'>
                        <CircularProgress size={24} />
                    </div>
                )}
            </div>
        );
    }

    handleScroll = e => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop - clientHeight < 100) {
            this.load();
        }
    };
}

class SharedMedia extends React.Component {
    state = {
        value: 0,
    };

    handleChange = (event, value) => {
        this.setState({ value });
    };

    render() {
        const { onClose, popup, chatId } = this.props;
        const { value } = this.state;

        const tabs = [
            { label: 'Media', filter: FILTER_TYPES.media },
            { label: 'Docs', filter: FILTER_TYPES.docs },
            { label: 'Links', filter: FILTER_TYPES.links },
            { label: 'Audio', filter: FILTER_TYPES.audio },
            { label: 'Voz', filter: FILTER_TYPES.voice },
            { label: 'Grupos', filter: null },
        ];

        const currentTab = tabs[value];

        const content = (
            <>
                <SharedMediaHeaderControl close={onClose} />
                <Tabs
                    value={value}
                    onChange={this.handleChange}
                    indicatorColor='primary'
                    textColor='primary'
                    scrollable
                    scrollButtons='off'>
                    {tabs.map(t => (
                        <Tab key={t.label} label={t.label} style={{ minWidth: '40px' }} />
                    ))}
                </Tabs>
                <div className='shared-media-content'>
                    {currentTab.filter ? (
                        <SharedMediaTab key={`${chatId}-${value}`} chatId={chatId} filter={currentTab.filter} />
                    ) : (
                        <GroupsInCommon chatId={chatId} />
                    )}
                </div>
            </>
        );

        return popup ? <>{content}</> : <div className='shared-media'>{content}</div>;
    }
}

SharedMedia.propTypes = {
    chatId: PropTypes.number.isRequired,
    onClose: PropTypes.func.isRequired,
    popup: PropTypes.bool,
    minHeight: PropTypes.number,
};

SharedMedia.defaultProps = {
    popup: false,
    minHeight: 0,
};

export default SharedMedia;
