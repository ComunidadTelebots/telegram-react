import React from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import CircularProgress from '@material-ui/core/CircularProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import TdLibController from '../../Controllers/TdLibController';
import './PrivacySettings.css';

const TTL_OPTIONS = [30, 90, 180, 365];

class AccountSettings extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            loading: false,
            ttlDays: 180,
            sensitive: false,
            sensitiveCanChange: false,
            autoDownload: null,
            editTTL: false,
            saving: false,
        };
    }

    open() {
        this.setState({ open: true, loading: true });
        Promise.all([
            TdLibController.send({ '@type': 'getAccountTTL' }),
            TdLibController.send({ '@type': 'getContentSettings' }),
            TdLibController.send({ '@type': 'getAutoDownloadSettings' }),
        ])
            .then(([ttl, content, dl]) => {
                this.setState({
                    ttlDays: ttl.days || 180,
                    sensitive: content.sensitive_enabled || false,
                    sensitiveCanChange: content.sensitive_can_change || false,
                    autoDownload: dl,
                    loading: false,
                });
            })
            .catch(() => this.setState({ loading: false }));
    }

    handleClose = () => this.setState({ open: false });

    handleSetTTL = async days => {
        this.setState({ editTTL: false, saving: true });
        try {
            await TdLibController.send({ '@type': 'setAccountTTL', days });
            this.setState({ ttlDays: days });
        } catch {}
        this.setState({ saving: false });
    };

    handleToggleSensitive = async () => {
        if (!this.state.sensitiveCanChange || this.state.saving) return;
        const next = !this.state.sensitive;
        this.setState({ saving: true });
        try {
            await TdLibController.send({ '@type': 'setContentSettings', sensitive_enabled: next });
            this.setState({ sensitive: next });
        } catch {}
        this.setState({ saving: false });
    };

    render() {
        const { open, loading, ttlDays, sensitive, sensitiveCanChange, editTTL, saving } = this.state;
        if (!open) return null;

        return (
            <>
                <div className='privacy-settings-overlay'>
                    <div className='privacy-settings-toolbar'>
                        <button className='privacy-settings-back' onClick={this.handleClose}>
                            <ArrowBackIcon />
                        </button>
                        <span className='privacy-settings-title'>Account & Data</span>
                    </div>
                    <div className='privacy-settings-content'>
                        {loading ? (
                            <div className='privacy-settings-loading'>
                                <CircularProgress size={28} />
                            </div>
                        ) : (
                            <>
                                <div className='privacy-settings-section'>
                                    <div className='privacy-settings-section-header'>Self-Destruct Timer</div>
                                    <button
                                        className='privacy-settings-row'
                                        onClick={() => this.setState({ editTTL: true })}>
                                        <span className='privacy-settings-row-content'>
                                            <span className='privacy-settings-row-label'>
                                                Delete account if inactive
                                            </span>
                                            <span className='privacy-settings-row-value'>{ttlDays} days</span>
                                        </span>
                                    </button>
                                </div>
                                <div className='privacy-settings-section'>
                                    <div className='privacy-settings-section-header'>Sensitive Content</div>
                                    <button
                                        className='privacy-settings-row'
                                        disabled={!sensitiveCanChange || saving}
                                        onClick={this.handleToggleSensitive}>
                                        <span className='privacy-settings-row-content'>
                                            <span className='privacy-settings-row-label'>Show sensitive content</span>
                                            <span className='privacy-settings-row-value'>
                                                {sensitiveCanChange ? '' : 'Not changeable in your region'}
                                            </span>
                                        </span>
                                        <span
                                            className={`android-settings-toggle${sensitive ? ' on' : ''}`}
                                            style={{ flexShrink: 0, marginLeft: 8 }}
                                        />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <Dialog open={editTTL} onClose={() => this.setState({ editTTL: false })} transitionDuration={0}>
                    <DialogTitle>Delete account after</DialogTitle>
                    <DialogContent style={{ padding: 0 }}>
                        <List disablePadding>
                            {TTL_OPTIONS.map(d => (
                                <ListItem key={d} button onClick={() => this.handleSetTTL(d)}>
                                    <ListItemText primary={`${d} days`} />
                                </ListItem>
                            ))}
                        </List>
                    </DialogContent>
                </Dialog>
            </>
        );
    }
}

export default AccountSettings;
