import React from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import CircularProgress from '@material-ui/core/CircularProgress';
import TdLibController from '../../Controllers/TdLibController';
import UserStore from '../../Stores/UserStore';
import { getUserFullName } from '../../Utils/User';
import './AdminLog.css';

function formatAction(action) {
    if (!action) return 'Unknown action';
    const cls = action.className || '';
    const map = {
        ChannelAdminLogEventActionChangeTitle: 'Changed title',
        ChannelAdminLogEventActionChangeAbout: 'Changed description',
        ChannelAdminLogEventActionChangeUsername: 'Changed username',
        ChannelAdminLogEventActionChangePhoto: 'Changed photo',
        ChannelAdminLogEventActionToggleInvites: 'Toggled invites',
        ChannelAdminLogEventActionToggleSignatures: 'Toggled signatures',
        ChannelAdminLogEventActionUpdatePinned: 'Pinned/unpinned message',
        ChannelAdminLogEventActionEditMessage: 'Edited message',
        ChannelAdminLogEventActionDeleteMessage: 'Deleted message',
        ChannelAdminLogEventActionParticipantJoin: 'User joined',
        ChannelAdminLogEventActionParticipantLeave: 'User left',
        ChannelAdminLogEventActionParticipantInvite: 'Invited user',
        ChannelAdminLogEventActionParticipantToggleBan: 'Changed user ban',
        ChannelAdminLogEventActionParticipantToggleAdmin: 'Changed admin rights',
        ChannelAdminLogEventActionChangeStickerSet: 'Changed sticker set',
        ChannelAdminLogEventActionTogglePreHistoryHidden: 'Toggled history visibility',
        ChannelAdminLogEventActionDefaultBannedRights: 'Changed default permissions',
        ChannelAdminLogEventActionStopPoll: 'Stopped poll',
        ChannelAdminLogEventActionChangeLinkedChat: 'Changed linked chat',
        ChannelAdminLogEventActionChangeLocation: 'Changed location',
        ChannelAdminLogEventActionToggleSlowMode: 'Toggled slow mode',
        ChannelAdminLogEventActionStartGroupCall: 'Started group call',
        ChannelAdminLogEventActionDiscardGroupCall: 'Ended group call',
        ChannelAdminLogEventActionParticipantMute: 'Muted participant',
        ChannelAdminLogEventActionParticipantUnmute: 'Unmuted participant',
        ChannelAdminLogEventActionToggleGroupCallSetting: 'Changed call settings',
        ChannelAdminLogEventActionParticipantJoinByInvite: 'Joined via link',
        ChannelAdminLogEventActionExportedInviteDelete: 'Deleted invite link',
        ChannelAdminLogEventActionExportedInviteRevoke: 'Revoked invite link',
        ChannelAdminLogEventActionExportedInviteEdit: 'Edited invite link',
        ChannelAdminLogEventActionParticipantVolume: 'Changed volume',
        ChannelAdminLogEventActionChangeHistoryTTL: 'Changed message TTL',
        ChannelAdminLogEventActionParticipantJoinByRequest: 'Joined by request',
        ChannelAdminLogEventActionToggleNoForwards: 'Toggled forward restriction',
        ChannelAdminLogEventActionSendMessage: 'Sent a message',
        ChannelAdminLogEventActionChangeAvailableReactions: 'Changed reactions',
        ChannelAdminLogEventActionChangeUsernames: 'Changed usernames',
        ChannelAdminLogEventActionToggleForum: 'Toggled forum mode',
        ChannelAdminLogEventActionCreateTopic: 'Created topic',
        ChannelAdminLogEventActionEditTopic: 'Edited topic',
        ChannelAdminLogEventActionDeleteTopic: 'Deleted topic',
        ChannelAdminLogEventActionPinTopic: 'Pinned topic',
        ChannelAdminLogEventActionToggleAntiSpam: 'Toggled anti-spam',
    };
    return map[cls] || cls.replace('ChannelAdminLogEventAction', '');
}

function formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts * 1000);
    return d.toLocaleString();
}

class AdminLog extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = { open: false, chatId: null, loading: false, events: [] };
    }

    open(chatId) {
        this.setState({ open: true, chatId, events: [], loading: true });
        TdLibController.send({ '@type': 'getAdminLog', chat_id: chatId, limit: 50 })
            .then(r => this.setState({ events: r.events || [], loading: false }))
            .catch(() => this.setState({ loading: false }));
    }

    handleClose = () => this.setState({ open: false });

    render() {
        const { open, loading, events } = this.state;
        if (!open) return null;

        return (
            <div className='admin-log-overlay'>
                <div className='admin-log-toolbar'>
                    <button className='admin-log-back' onClick={this.handleClose}>
                        <ArrowBackIcon />
                    </button>
                    <span className='admin-log-title'>Recent Actions</span>
                </div>
                <div className='admin-log-content'>
                    {loading && (
                        <div className='admin-log-loading'>
                            <CircularProgress size={28} />
                        </div>
                    )}
                    {!loading && events.length === 0 && <div className='admin-log-empty'>No recent actions</div>}
                    {events.map(e => {
                        const user = UserStore.get(parseInt(e.user_id));
                        const name = user ? getUserFullName(parseInt(e.user_id)) : e.user_id;
                        return (
                            <div key={e.id} className='admin-log-event'>
                                <div className='admin-log-event-header'>
                                    <span className='admin-log-event-user'>{name}</span>
                                    <span className='admin-log-event-date'>{formatDate(e.date)}</span>
                                </div>
                                <div className='admin-log-event-action'>{formatAction(e.action)}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}

export default AdminLog;
