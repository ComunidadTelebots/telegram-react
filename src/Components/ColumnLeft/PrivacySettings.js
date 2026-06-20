import React from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import CircularProgress from '@material-ui/core/CircularProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import TdLibController from '../../Controllers/TdLibController';
import './PrivacySettings.css';

const PRIVACY_KEYS = [
    { key: 'StatusTimestamp', label: 'Last Seen & Online' },
    { key: 'ProfilePhoto', label: 'Profile Photo' },
    { key: 'PhoneNumber', label: 'Phone Number' },
    { key: 'PhoneCall', label: 'Calls' },
    { key: 'Forwards', label: 'Forwarded Messages' },
    { key: 'ChatInvite', label: 'Groups & Channels' },
    { key: 'VoiceMessages', label: 'Voice Messages' },
    { key: 'About', label: 'Bio' },
    { key: 'Birthday', label: 'Birthday' },
];

const RULE_LABELS = {
    PrivacyValueAllowAll: 'Everyone',
    PrivacyValueAllowContacts: 'My Contacts',
    PrivacyValueDisallowAll: 'Nobody',
};

function getRuleLabel(rules) {
    if (!rules || !rules.length) return '—';
    const cls = rules[0].className;
    return RULE_LABELS[cls] || cls || '—';
}

class PrivacySettings extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            loading: false,
            privacyMap: {},
            editKey: null,
            editSaving: false,
        };
    }

    open() {
        this.setState({ open: true, privacyMap: {}, loading: true });
        this._loadAll();
    }

    _loadAll = async () => {
        const map = {};
        await Promise.all(
            PRIVACY_KEYS.map(async ({ key }) => {
                try {
                    const res = await TdLibController.send({ '@type': 'getPrivacy', key });
                    map[key] = res.rules || [];
                } catch {
                    map[key] = [];
                }
            }),
        );
        this.setState({ privacyMap: map, loading: false });
    };

    handleClose = () => this.setState({ open: false });

    handleRowClick = key => this.setState({ editKey: key });

    handleEditClose = () => this.setState({ editKey: null });

    handleSetRule = async rule => {
        const { editKey } = this.state;
        if (!editKey || this.state.editSaving) return;
        this.setState({ editSaving: true });
        try {
            await TdLibController.send({ '@type': 'setPrivacy', key: editKey, rule });
            const res = await TdLibController.send({ '@type': 'getPrivacy', key: editKey });
            this.setState(prev => ({
                privacyMap: { ...prev.privacyMap, [editKey]: res.rules || [] },
                editKey: null,
                editSaving: false,
            }));
        } catch {
            this.setState({ editSaving: false });
        }
    };

    render() {
        const { open, loading, privacyMap, editKey, editSaving } = this.state;
        if (!open) return null;

        const editLabel = editKey ? PRIVACY_KEYS.find(k => k.key === editKey)?.label : '';

        return (
            <>
                <div className='privacy-settings-overlay'>
                    <div className='privacy-settings-toolbar'>
                        <button className='privacy-settings-back' onClick={this.handleClose}>
                            <ArrowBackIcon />
                        </button>
                        <span className='privacy-settings-title'>Privacy and Security</span>
                    </div>
                    <div className='privacy-settings-content'>
                        {loading ? (
                            <div className='privacy-settings-loading'>
                                <CircularProgress size={28} />
                            </div>
                        ) : (
                            <div className='privacy-settings-section'>
                                <div className='privacy-settings-section-header'>Privacy</div>
                                {PRIVACY_KEYS.map(({ key, label }) => (
                                    <button
                                        key={key}
                                        className='privacy-settings-row'
                                        onClick={() => this.handleRowClick(key)}>
                                        <span className='privacy-settings-row-content'>
                                            <span className='privacy-settings-row-label'>{label}</span>
                                            <span className='privacy-settings-row-value'>
                                                {getRuleLabel(privacyMap[key])}
                                            </span>
                                        </span>
                                        <ChevronRightIcon className='privacy-settings-row-arrow' />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <Dialog open={!!editKey} onClose={this.handleEditClose} transitionDuration={0}>
                    <DialogTitle>{editLabel}</DialogTitle>
                    <DialogContent style={{ padding: 0 }}>
                        <List disablePadding>
                            {[
                                { rule: 'AllowAll', label: 'Everyone' },
                                { rule: 'AllowContacts', label: 'My Contacts' },
                                { rule: 'DisallowAll', label: 'Nobody' },
                            ].map(({ rule, label }) => (
                                <ListItem
                                    key={rule}
                                    button
                                    disabled={editSaving}
                                    onClick={() => this.handleSetRule(rule)}>
                                    <ListItemText primary={label} />
                                </ListItem>
                            ))}
                        </List>
                    </DialogContent>
                </Dialog>
            </>
        );
    }
}

export default PrivacySettings;
