/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import classNames from 'classnames';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import SearchIcon from '@material-ui/icons/Search';
import DateRangeIcon from '@material-ui/icons/DateRange';
import CallIcon from '@material-ui/icons/Call';
import VideocamIcon from '@material-ui/icons/Videocam';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import { compose } from 'recompose';
import MainMenuButton from './MainMenuButton';
import HeaderCommand from './HeaderCommand';
import HeaderProgress from './HeaderProgress';
import ChatSearch from './ChatSearch';
import AutoDeleteTimer from './AutoDeleteTimer';
import ChannelStatsDialog from './ChannelStatsDialog';
import ForumTopicsList from '../Additional/ForumTopicsList';
import TimerIcon from '@material-ui/icons/Timer';
import BarChartIcon from '@material-ui/icons/BarChart';
import ForumIcon from '@material-ui/icons/Forum';
import VolumeOffIcon from '@material-ui/icons/VolumeOff';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import Brightness7Icon from '@material-ui/icons/Brightness7';
import ArchiveIcon from '@material-ui/icons/Archive';
import UnarchiveIcon from '@material-ui/icons/Unarchive';
import LinkIcon from '@material-ui/icons/Link';
import Snackbar from '@material-ui/core/Snackbar';
import { borderStyle } from '../Theme';
import LockIcon from '@material-ui/icons/Lock';
import {
    getChatShortTitle,
    getChatSubtitle,
    getChatTitle,
    isAccentChatSubtitle,
    isPrivateChat,
    isChatSecret,
} from '../../Utils/Chat';
import { clearSelection, searchChat } from '../../Actions/Client';
import ChatStore from '../../Stores/ChatStore';
import UserStore from '../../Stores/UserStore';
import BasicGroupStore from '../../Stores/BasicGroupStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import MessageStore from '../../Stores/MessageStore';
import AppStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './Header.css';

const styles = theme => ({
    button: {
        margin: '14px',
    },
    menuIconButton: {
        margin: '8px -2px 8px 12px',
    },
    searchIconButton: {
        margin: '8px 12px 8px 0',
    },
    messageSearchIconButton: {
        margin: '8px 0 8px 12px',
    },
    moreIconButton: {
        margin: '8px 12px 8px 0',
    },
    headerStatusTitle: {
        color: theme.palette.text.secondary,
    },
    headerStatusAccentTitle: {
        color: theme.palette.primary.dark + '!important',
    },
    ...borderStyle(theme),
});

class Header extends Component {
    constructor(props) {
        super(props);

        this.state = {
            authorizationState: AppStore.getAuthorizationState(),
            connectionState: AppStore.getConnectionState(),
            openDeleteDialog: false,
            openJumpToDate: false,
            showChatSearch: false,
            inviteLinkCopied: false,
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextState !== this.state) {
            return true;
        }

        if (nextProps.theme !== this.props.theme) {
            return true;
        }

        if (nextProps.t !== this.props.t) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        AppStore.on('clientUpdateDeleteMessages', this.onClientUpdateDeleteMessages);
        AppStore.on('updateConnectionState', this.onUpdateConnectionState);
        AppStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
        AppStore.on('clientUpdateChatId', this.onClientUpdateChatId);

        MessageStore.on('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
        MessageStore.on('clientUpdateClearSelection', this.onClientUpdateMessageSelected);

        ChatStore.on('updateChatOnlineMemberCount', this.onUpdateChatOnlineMemberCount);
        ChatStore.on('updateChatTitle', this.onUpdateChatTitle);
        ChatStore.on('updateSecretChat', this.onUpdateSecretChat);
        UserStore.on('updateUserStatus', this.onUpdateUserStatus);
        ChatStore.on('updateUserChatAction', this.onUpdateUserChatAction);
        UserStore.on('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.on('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.on('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
        BasicGroupStore.on('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.on('updateSupergroup', this.onUpdateSupergroup);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateDeleteMessages', this.onClientUpdateDeleteMessages);
        AppStore.off('updateConnectionState', this.onUpdateConnectionState);
        AppStore.off('updateAuthorizationState', this.onUpdateAuthorizationState);
        AppStore.off('clientUpdateChatId', this.onClientUpdateChatId);

        MessageStore.off('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
        MessageStore.off('clientUpdateClearSelection', this.onClientUpdateMessageSelected);

        ChatStore.off('updateChatOnlineMemberCount', this.onUpdateChatOnlineMemberCount);
        ChatStore.off('updateChatTitle', this.onUpdateChatTitle);
        ChatStore.off('updateSecretChat', this.onUpdateSecretChat);
        UserStore.off('updateUserStatus', this.onUpdateUserStatus);
        ChatStore.off('updateUserChatAction', this.onUpdateUserChatAction);
        UserStore.off('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.off('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.off('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
        BasicGroupStore.off('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.off('updateSupergroup', this.onUpdateSupergroup);
    }

    onClientUpdateDeleteMessages = update => {
        const { chatId, messageIds } = update;

        let canBeDeletedForAllUsers = true;
        for (let messageId of messageIds) {
            const message = MessageStore.get(chatId, messageId);
            if (!message) {
                canBeDeletedForAllUsers = false;
                break;
            }
            if (!message.can_be_deleted_for_all_users) {
                canBeDeletedForAllUsers = false;
                break;
            }
        }

        this.setState({
            openDeleteDialog: true,
            chatId,
            messageIds,
            canBeDeletedForAllUsers: canBeDeletedForAllUsers,
            revoke: canBeDeletedForAllUsers,
        });
    };

    handleRevokeChange = () => {
        this.setState({ revoke: !this.state.revoke });
    };

    handleCloseDelete = () => {
        this.setState({ openDeleteDialog: false });
    };

    handleJumpToDate = () => {
        this.setState({ openJumpToDate: true });
    };

    handleSearchChat = () => {
        this.setState(s => ({ showChatSearch: !s.showChatSearch }));
    };

    handleCloseChatSearch = () => {
        this.setState({ showChatSearch: false });
    };

    handleOpenAutoDelete = () => {
        this.autoDeleteRef && this.autoDeleteRef.open();
    };

    handleVoiceCall = () => {
        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat || !chat.type) return;
        const type = chat.type['@type'];
        if (type !== 'chatTypePrivate' && type !== 'chatTypeSecret') return;
        const userId = chat.type.user_id;
        import('../../Controllers/CallController').then(({ default: callController }) => {
            callController.requestCall(userId, false);
        });
    };

    handleVideoCall = () => {
        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat || !chat.type) return;
        const type = chat.type['@type'];
        if (type !== 'chatTypePrivate' && type !== 'chatTypeSecret') return;
        const userId = chat.type.user_id;
        import('../../Controllers/CallController').then(({ default: callController }) => {
            callController.requestCall(userId, true);
        });
    };

    handleMuteToggle = async () => {
        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return;
        const isMuted = chat.notification_settings && chat.notification_settings.mute_for > 0;
        try {
            await TdLibController.send({
                '@type': 'setChatNotificationSettings',
                chat_id: chatId,
                notification_settings: {
                    '@type': 'chatNotificationSettings',
                    use_default_mute_for: false,
                    mute_for: isMuted ? 0 : 2147483647,
                    use_default_sound: true,
                    use_default_show_preview: true,
                },
            });
            this.forceUpdate();
        } catch {}
    };

    handleArchiveToggle = async () => {
        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return;
        const isArchived = chat.positions && chat.positions.some(p => p.list && p.list['@type'] === 'chatListArchive');
        try {
            await TdLibController.send({
                '@type': 'addChatToList',
                chat_id: chatId,
                chat_list: isArchived ? { '@type': 'chatListMain' } : { '@type': 'chatListArchive' },
            });
            this.forceUpdate();
        } catch {}
    };

    handleThemeToggle = () => {
        const isDark = AppStore.getNightMode ? AppStore.getNightMode() : document.body.classList.contains('night');
        TdLibController.clientUpdate({ '@type': 'clientUpdateThemeChanging', night: !isDark });
    };

    handleCopyInviteLink = async () => {
        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return;
        try {
            const result = await TdLibController.send({ '@type': 'getGroupInviteLink', chat_id: chatId });
            if (result && result.invite_link) {
                await navigator.clipboard.writeText(result.invite_link);
                this.setState({ inviteLinkCopied: true });
            }
        } catch {}
    };

    handleCloseJumpToDate = () => {
        this.setState({ openJumpToDate: false });
    };

    handleConfirmJumpToDate = async e => {
        e.preventDefault();
        const date = this.jumpToDateInput && this.jumpToDateInput.value;
        if (!date) return;
        const ts = Math.floor(new Date(date).getTime() / 1000);
        this.handleCloseJumpToDate();
        const { chatId } = this.props;
        try {
            const result = await TdLibController.send({
                '@type': 'getChatMessageByDate',
                chat_id: chatId,
                date: ts,
            });
            if (result && result.id) {
                TdLibController.clientUpdate({
                    '@type': 'clientUpdateMessageSelected',
                    chatId,
                    messageId: result.id,
                    selected: false,
                });
                import('../../Actions/Client').then(({ highlightMessage }) => highlightMessage(chatId, result.id));
            }
        } catch {}
    };

    handleDeleteContinue = () => {
        const { revoke, chatId, messageIds } = this.state;

        clearSelection();
        this.handleCloseDelete();

        TdLibController.send({
            '@type': 'deleteMessages',
            chat_id: chatId,
            message_ids: messageIds,
            revoke: revoke,
        });
    };

    onUpdateChatOnlineMemberCount = update => {
        const chat = ChatStore.get(AppStore.getChatId());
        if (!chat) return;
        if (chat.id !== update.chat_id) return;

        this.forceUpdate();
    };

    onClientUpdateMessageSelected = update => {
        this.setState({ selectionCount: MessageStore.selectedItems.size });
    };

    onClientUpdateChatId = update => {
        this.forceUpdate();
    };

    onUpdateConnectionState = update => {
        this.setState({ connectionState: update.state });
    };

    onUpdateAuthorizationState = update => {
        this.setState({ authorizationState: update.authorization_state });
    };

    onUpdateChatTitle = update => {
        const chat = ChatStore.get(AppStore.getChatId());
        if (!chat) return;
        if (chat.id !== update.chat_id) return;

        this.forceUpdate();
    };

    onUpdateSecretChat = update => {
        const chat = ChatStore.get(AppStore.getChatId());
        if (!chat || !chat.type || chat.type['@type'] !== 'chatTypeSecret') return;
        if (chat.type.secret_chat_id !== update.secret_chat.id) return;

        this.forceUpdate();
    };

    onUpdateUserStatus = update => {
        const chat = ChatStore.get(AppStore.getChatId());
        if (!chat) return;
        if (!chat.type) return;

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup': {
                const fullInfo = BasicGroupStore.getFullInfo(chat.type.basic_group_id);
                if (fullInfo && fullInfo.members) {
                    const member = fullInfo.members.find(x => x.user_id === update.user_id);
                    if (member) {
                        this.forceUpdate();
                    }
                }
                break;
            }
            case 'chatTypePrivate': {
                if (chat.type.user_id === update.user_id) {
                    this.forceUpdate();
                }
                break;
            }
            case 'chatTypeSecret': {
                if (chat.type.user_id === update.user_id) {
                    this.forceUpdate();
                }
                break;
            }
            case 'chatTypeSupergroup': {
                break;
            }
        }
    };

    onUpdateUserChatAction = update => {
        const currentChatId = AppStore.getChatId();

        if (currentChatId === update.chat_id) {
            this.forceUpdate();
        }
    };

    onUpdateBasicGroup = update => {
        const chat = ChatStore.get(AppStore.getChatId());
        if (!chat) return;

        if (
            chat.type &&
            chat.type['@type'] === 'chatTypeBasicGroup' &&
            chat.type.basic_group_id === update.basic_group.id
        ) {
            this.forceUpdate();
        }
    };

    onUpdateSupergroup = update => {
        const chat = ChatStore.get(AppStore.getChatId());
        if (!chat) return;

        if (
            chat.type &&
            chat.type['@type'] === 'chatTypeSupergroup' &&
            chat.type.supergroup_id === update.supergroup.id
        ) {
            this.forceUpdate();
        }
    };

    onUpdateBasicGroupFullInfo = update => {
        const chat = ChatStore.get(AppStore.getChatId());
        if (!chat) return;

        if (
            chat.type &&
            chat.type['@type'] === 'chatTypeBasicGroup' &&
            chat.type.basic_group_id === update.basic_group_id
        ) {
            this.forceUpdate();
        }
    };

    onUpdateSupergroupFullInfo = update => {
        const chat = ChatStore.get(AppStore.getChatId());
        if (!chat) return;

        if (
            chat.type &&
            chat.type['@type'] === 'chatTypeSupergroup' &&
            chat.type.supergroup_id === update.supergroup_id
        ) {
            this.forceUpdate();
        }
    };

    onUpdateUserFullInfo = update => {
        const chat = ChatStore.get(AppStore.getChatId());
        if (!chat) return;

        if (
            chat.type &&
            (chat.type['@type'] === 'chatTypePrivate' || chat.type['@type'] === 'chatTypeSecret') &&
            chat.type.user_id === update.user_id
        ) {
            this.forceUpdate();
        }
    };

    openChatDetails = () => {
        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        AppStore.changeChatDetailsVisibility(true);
    };

    handleSearchChat = () => {
        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        searchChat(chatId);
    };

    localize = str => {
        const { t } = this.props;

        return t(str)
            .replace('...', '')
            .replace('…', '');
    };

    render() {
        const { classes, t } = this.props;
        const {
            authorizationState,
            connectionState,
            selectionCount,
            openDeleteDialog,
            canBeDeletedForAllUsers,
            revoke,
            messageIds,
            showChatSearch,
        } = this.state;

        const count = messageIds ? messageIds.length : 0;

        let control = null;
        if (selectionCount) {
            control = <HeaderCommand count={selectionCount} />;
        }

        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);

        const isAccentSubtitle = isAccentChatSubtitle(chatId);
        const isSecret = isChatSecret(chatId);
        let title = getChatTitle(chatId, true, t);
        let subtitle = getChatSubtitle(chatId, true);
        let isTyping = false;

        const typingManager = chatId ? ChatStore.getTypingManager(chatId) : null;
        if (typingManager && typingManager.actions && typingManager.actions.size > 0) {
            const now = new Date();
            const activeUsers = [...typingManager.actions.entries()].filter(([, v]) => v.expire > now);
            if (activeUsers.length > 0) {
                isTyping = true;
                if (activeUsers.length === 1) {
                    const [userId] = activeUsers[0];
                    const user = UserStore.get(userId);
                    const name = user ? user.first_name || user.last_name || 'Alguien' : 'Alguien';
                    const action = activeUsers[0][1].action;
                    const actionText =
                        action['@type'] === 'chatActionRecordingVoiceNote'
                            ? 'grabando audio...'
                            : action['@type'] === 'chatActionUploadingDocument'
                            ? 'enviando archivo...'
                            : action['@type'] === 'chatActionUploadingPhoto'
                            ? 'enviando foto...'
                            : 'escribiendo...';
                    subtitle = `${name} está ${actionText}`;
                } else if (activeUsers.length === 2) {
                    const names = activeUsers.map(([uid]) => {
                        const u = UserStore.get(uid);
                        return u ? u.first_name || 'Alguien' : 'Alguien';
                    });
                    subtitle = `${names[0]} y ${names[1]} están escribiendo...`;
                } else {
                    subtitle = `${activeUsers.length} personas están escribiendo...`;
                }
            }
        }
        let showProgressAnimation = false;

        if (isSecret && chat && chat.type && chat.type['@type'] === 'chatTypeSecret') {
            const sc = ChatStore.secretChats && ChatStore.secretChats.get(chat.type.secret_chat_id);
            if (sc && sc.state && sc.state['@type'] === 'secretChatStatePending') {
                subtitle = t('EncryptionKeyWait');
            }
        }

        if (connectionState) {
            switch (connectionState['@type']) {
                case 'connectionStateConnecting':
                    title = this.localize('Connecting');
                    subtitle = '';
                    showProgressAnimation = true;
                    break;
                case 'connectionStateConnectingToProxy':
                    title = this.localize('Connecting to proxy');
                    subtitle = '';
                    showProgressAnimation = true;
                    break;
                case 'connectionStateReady':
                    break;
                case 'connectionStateUpdating':
                    title = this.localize('Updating');
                    subtitle = '';
                    showProgressAnimation = true;
                    break;
                case 'connectionStateWaitingForNetwork':
                    title = this.localize('Waiting for network');
                    subtitle = '';
                    showProgressAnimation = true;
                    break;
            }
        } else if (authorizationState) {
            switch (authorizationState['@type']) {
                case 'authorizationStateClosed':
                    break;
                case ' authorizationStateClosing':
                    break;
                case 'authorizationStateLoggingOut':
                    title = this.localize('Logging out');
                    subtitle = '';
                    showProgressAnimation = true;
                    break;
                case 'authorizationStateReady':
                    break;
                case 'authorizationStateWaitCode':
                    break;
                case 'authorizationStateWaitEncryptionKey':
                    title = this.localize('Loading');
                    subtitle = '';
                    showProgressAnimation = true;
                    break;
                case 'authorizationStateWaitPassword':
                    break;
                case 'authorizationStateWaitPhoneNumber':
                    break;
                case 'authorizationStateWaitTdlibParameters':
                    title = this.localize('Loading');
                    subtitle = '';
                    showProgressAnimation = true;
                    break;
            }
        } else {
            title = this.localize('Loading');
            subtitle = '';
            showProgressAnimation = true;
        }

        control = control || (
            <div className={classNames(classes.borderColor, 'header-details')}>
                <IconButton
                    className='header-mobile-back'
                    aria-label='Back'
                    onClick={() => TdLibController.setChatId(0)}>
                    <ArrowBackIcon />
                </IconButton>
                <div
                    className={classNames('header-status', 'grow', chat ? 'cursor-pointer' : 'cursor-default')}
                    onClick={this.openChatDetails}>
                    <span className='header-status-content'>
                        {isSecret && <LockIcon style={{ fontSize: 15, verticalAlign: 'middle', marginRight: 3 }} />}
                        {title}
                    </span>
                    {showProgressAnimation && <HeaderProgress />}
                    <span
                        className={classNames('header-status-title', classes.headerStatusTitle, {
                            [classes.headerStatusAccentTitle]: isAccentSubtitle && !isTyping,
                            'header-typing': isTyping,
                        })}>
                        {subtitle}
                    </span>
                    <span className='header-status-tail' />
                </div>
                {chat && (
                    <>
                        {isPrivateChat(chatId) && (
                            <>
                                <IconButton
                                    className={classes.messageSearchIconButton}
                                    aria-label='Voice call'
                                    title='Voice call'
                                    onClick={this.handleVoiceCall}>
                                    <CallIcon />
                                </IconButton>
                                <IconButton
                                    className={classes.messageSearchIconButton}
                                    aria-label='Video call'
                                    title='Video call'
                                    onClick={this.handleVideoCall}>
                                    <VideocamIcon />
                                </IconButton>
                            </>
                        )}
                        <IconButton
                            className={classes.messageSearchIconButton}
                            aria-label='Search in chat'
                            title='Buscar en el chat'
                            onClick={this.handleSearchChat}>
                            <SearchIcon />
                        </IconButton>
                        <IconButton
                            className={classes.messageSearchIconButton}
                            aria-label='Auto-delete timer'
                            title='Borrado automático'
                            onClick={this.handleOpenAutoDelete}>
                            <TimerIcon />
                        </IconButton>
                        <IconButton
                            className={classes.messageSearchIconButton}
                            aria-label='Jump to date'
                            title='Jump to date'
                            onClick={this.handleJumpToDate}>
                            <DateRangeIcon />
                        </IconButton>
                        {(() => {
                            const _cid = AppStore.getChatId();
                            const _chat = ChatStore.get(_cid);
                            const _type = _chat && _chat.type;
                            if (!_type || _type['@type'] !== 'chatTypeSupergroup') return null;
                            const _sg = SupergroupStore.get(_type.supergroup_id);
                            if (!_sg) return null;
                            return (
                                <>
                                    {_sg.is_forum && (
                                        <IconButton
                                            className={classes.messageSearchIconButton}
                                            aria-label='Forum topics'
                                            title='Forum topics'
                                            onClick={() =>
                                                this.forumTopicsRef && this.forumTopicsRef.open(_cid, _chat.title || '')
                                            }>
                                            <ForumIcon />
                                        </IconButton>
                                    )}
                                    {_sg.is_broadcast && (
                                        <IconButton
                                            className={classes.messageSearchIconButton}
                                            aria-label='Estadísticas del canal'
                                            title='Estadísticas del canal'
                                            onClick={() => this.channelStatsRef && this.channelStatsRef.open()}>
                                            <BarChartIcon />
                                        </IconButton>
                                    )}
                                </>
                            );
                        })()}
                        {(() => {
                            const isNight = document.body.classList.contains('night');
                            return (
                                <IconButton
                                    className={classes.messageSearchIconButton}
                                    aria-label={isNight ? 'Modo claro' : 'Modo oscuro'}
                                    title={isNight ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                                    onClick={this.handleThemeToggle}>
                                    {isNight ? <Brightness7Icon /> : <Brightness4Icon />}
                                </IconButton>
                            );
                        })()}
                        {(() => {
                            const _cid2 = AppStore.getChatId();
                            const _chat2 = ChatStore.get(_cid2);
                            if (!_chat2) return null;
                            const isMuted = _chat2.notification_settings && _chat2.notification_settings.mute_for > 0;
                            return (
                                <IconButton
                                    className={classes.messageSearchIconButton}
                                    aria-label={isMuted ? 'Activar notificaciones' : 'Silenciar chat'}
                                    title={isMuted ? 'Activar notificaciones' : 'Silenciar chat'}
                                    onClick={this.handleMuteToggle}>
                                    {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                                </IconButton>
                            );
                        })()}
                        {(() => {
                            const _cid3 = AppStore.getChatId();
                            const _chat3 = ChatStore.get(_cid3);
                            if (!_chat3) return null;
                            const isArchived =
                                _chat3.positions &&
                                _chat3.positions.some(p => p.list && p.list['@type'] === 'chatListArchive');
                            return (
                                <IconButton
                                    className={classes.messageSearchIconButton}
                                    aria-label={isArchived ? 'Desarchivar' : 'Archivar chat'}
                                    title={isArchived ? 'Desarchivar' : 'Archivar chat'}
                                    onClick={this.handleArchiveToggle}>
                                    {isArchived ? <UnarchiveIcon /> : <ArchiveIcon />}
                                </IconButton>
                            );
                        })()}
                        {(() => {
                            const _cid4 = AppStore.getChatId();
                            const _chat4 = ChatStore.get(_cid4);
                            if (!_chat4 || !_chat4.type) return null;
                            const t4 = _chat4.type['@type'];
                            if (t4 !== 'chatTypeSupergroup' && t4 !== 'chatTypeBasicGroup') return null;
                            return (
                                <IconButton
                                    className={classes.messageSearchIconButton}
                                    aria-label='Copiar enlace de invitación'
                                    title='Copiar enlace de invitación'
                                    onClick={this.handleCopyInviteLink}>
                                    <LinkIcon />
                                </IconButton>
                            );
                        })()}
                        <MainMenuButton openChatDetails={this.openChatDetails} />
                    </>
                )}
            </div>
        );

        return (
            <>
                {control}
                {showChatSearch && <ChatSearch chatId={AppStore.getChatId()} onClose={this.handleCloseChatSearch} />}
                <AutoDeleteTimer ref={r => (this.autoDeleteRef = r)} />
                <ChannelStatsDialog chatId={AppStore.getChatId()} ref={r => (this.channelStatsRef = r)} />
                <Snackbar
                    open={this.state.inviteLinkCopied}
                    autoHideDuration={2000}
                    onClose={() => this.setState({ inviteLinkCopied: false })}
                    message='Enlace de invitación copiado'
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                />
                <Dialog
                    transitionDuration={0}
                    open={openDeleteDialog}
                    onClose={this.handleCloseDelete}
                    aria-labelledby='delete-dialog-title'>
                    <DialogTitle id='delete-dialog-title'>Confirm</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {count === 1
                                ? 'Are you sure you want to delete 1 message?'
                                : `Are you sure you want to delete ${count} messages?`}
                        </DialogContentText>
                        {canBeDeletedForAllUsers && (
                            <FormControlLabel
                                control={
                                    <Checkbox checked={revoke} onChange={this.handleRevokeChange} color='primary' />
                                }
                                label={
                                    isPrivateChat(chatId) ? `Delete for ${getChatShortTitle(chatId)}` : 'Delete for all'
                                }
                            />
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleCloseDelete} color='primary'>
                            {t('Cancel')}
                        </Button>
                        <Button onClick={this.handleDeleteContinue} color='primary'>
                            {t('Ok')}
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog
                    transitionDuration={0}
                    open={this.state.openJumpToDate}
                    onClose={this.handleCloseJumpToDate}
                    aria-labelledby='jump-to-date-title'>
                    <DialogTitle id='jump-to-date-title'>Jump to date</DialogTitle>
                    <DialogContent>
                        <input
                            type='date'
                            ref={el => (this.jumpToDateInput = el)}
                            defaultValue={new Date().toISOString().slice(0, 10)}
                            style={{
                                fontSize: 16,
                                padding: '8px 12px',
                                borderRadius: 6,
                                border: '1px solid #ccc',
                                width: '100%',
                            }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleCloseJumpToDate} color='primary'>
                            Cancel
                        </Button>
                        <Button onClick={this.handleConfirmJumpToDate} color='primary'>
                            Go
                        </Button>
                    </DialogActions>
                </Dialog>
                <ForumTopicsList ref={r => (this.forumTopicsRef = r)} />
            </>
        );
    }
}

const enhance = compose(withTranslation(), withStyles(styles, { withTheme: true }));

export default enhance(Header);
