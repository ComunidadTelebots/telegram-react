import React from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import CircularProgress from '@material-ui/core/CircularProgress';
import TdLibController from '../../Controllers/TdLibController';
import './PrivacySettings.css';

const GLOBAL_OPTIONS = [
    { key: 'archive_and_mute_new_noncontact_peers', label: 'Archive & mute new non-contact messages' },
    { key: 'keep_archived_unmuted', label: 'Keep archived chats unmuted' },
    { key: 'keep_archived_folders', label: 'Keep archived in folders' },
    { key: 'hide_read_marks', label: 'Hide read marks' },
    { key: 'new_noncontact_peers_require_premium', label: 'Require Premium to message me' },
];

class GlobalPrivacySettings extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = { open: false, loading: false, settings: {}, saving: false };
    }

    open() {
        this.setState({ open: true, loading: true, settings: {} });
        TdLibController.send({ '@type': 'getGlobalPrivacySettings' })
            .then(r => this.setState({ settings: r, loading: false }))
            .catch(() => this.setState({ loading: false }));
    }

    handleClose = () => this.setState({ open: false });

    handleToggle = async key => {
        if (this.state.saving) return;
        const newSettings = { ...this.state.settings, [key]: !this.state.settings[key] };
        this.setState({ settings: newSettings, saving: true });
        try {
            await TdLibController.send({ '@type': 'setGlobalPrivacySettings', settings: newSettings });
        } catch {
            this.setState(prev => ({ settings: { ...prev.settings, [key]: !prev.settings[key] } }));
        } finally {
            this.setState({ saving: false });
        }
    };

    render() {
        const { open, loading, settings, saving } = this.state;
        if (!open) return null;

        return (
            <div className='privacy-settings-overlay'>
                <div className='privacy-settings-toolbar'>
                    <button className='privacy-settings-back' onClick={this.handleClose}>
                        <ArrowBackIcon />
                    </button>
                    <span className='privacy-settings-title'>Global Privacy</span>
                </div>
                <div className='privacy-settings-content'>
                    {loading ? (
                        <div className='privacy-settings-loading'>
                            <CircularProgress size={28} />
                        </div>
                    ) : (
                        <div className='privacy-settings-section'>
                            <div className='privacy-settings-section-header'>Global Options</div>
                            {GLOBAL_OPTIONS.map(({ key, label }) => (
                                <button
                                    key={key}
                                    className='privacy-settings-row'
                                    disabled={saving}
                                    onClick={() => this.handleToggle(key)}>
                                    <span className='privacy-settings-row-content'>
                                        <span className='privacy-settings-row-label'>{label}</span>
                                    </span>
                                    <span
                                        className={`android-settings-toggle${settings[key] ? ' on' : ''}`}
                                        style={{ flexShrink: 0, marginLeft: 8 }}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default GlobalPrivacySettings;
