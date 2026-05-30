import React from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import NotificationsIcon from '@material-ui/icons/Notifications';
import LockIcon from '@material-ui/icons/Lock';
import DataUsageIcon from '@material-ui/icons/DataUsage';
import ChatIcon from '@material-ui/icons/Chat';
import PaletteIcon from '@material-ui/icons/Palette';
import LanguageIcon from '@material-ui/icons/Language';
import HelpIcon from '@material-ui/icons/Help';
import InfoIcon from '@material-ui/icons/Info';
import Brightness2Icon from '@material-ui/icons/Brightness2';
import WbSunnyIcon from '@material-ui/icons/WbSunny';
import StorageIcon from '@material-ui/icons/Storage';
import { getSrc } from '../../Utils/File';
import { getUserFullName } from '../../Utils/User';
import UserStore from '../../Stores/UserStore';
import OptionStore from '../../Stores/OptionStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import './AndroidSettings.css';

class AndroidSettings extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            isDark: document.body.classList.contains('theme-dark'),
            notifications: true,
        };
    }

    getMe() {
        const myId = OptionStore.get('my_id');
        if (!myId || !myId.value) return null;
        return UserStore.get(myId.value);
    }

    handleToggleDark = () => {
        const isDark = !this.state.isDark;
        this.setState({ isDark });
        ApplicationStore.emit('clientUpdateThemeChanging', {
            type: isDark ? 'dark' : 'light',
            primary: { main: '#229af0' },
        });
    };

    handleAppearance = () => {
        this.props.onAppearance && this.props.onAppearance();
    };

    render() {
        const { onClose } = this.props;
        const { isDark, notifications } = this.state;
        const me = this.getMe();
        const name = me ? getUserFullName(me) : 'Telegram User';
        const phone = me && me.phone_number ? '+' + me.phone_number : '';
        const username = me && me.username ? '@' + me.username : '';
        const initials = name
            .split(' ')
            .map(w => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
        const avatarSrc = me ? getSrc(me.profile_photo ? me.profile_photo.small : null) : null;

        const sections = [
            {
                title: 'Account',
                rows: [
                    {
                        icon: <NotificationsIcon />,
                        label: 'Notifications and Sounds',
                        value: '',
                        arrow: true,
                        action: null,
                    },
                    { icon: <LockIcon />, label: 'Privacy and Security', value: '', arrow: true, action: null },
                    { icon: <DataUsageIcon />, label: 'Data and Storage', value: '', arrow: true, action: null },
                    { icon: <ChatIcon />, label: 'Chat Settings', value: '', arrow: true, action: null },
                ],
            },
            {
                title: 'Display',
                rows: [
                    {
                        icon: isDark ? <WbSunnyIcon /> : <Brightness2Icon />,
                        label: 'Night Mode',
                        value: '',
                        toggle: true,
                        toggleOn: isDark,
                        action: this.handleToggleDark,
                    },
                    {
                        icon: <PaletteIcon />,
                        label: 'Appearance',
                        value: 'Design & Theme',
                        arrow: true,
                        action: this.handleAppearance,
                    },
                    { icon: <LanguageIcon />, label: 'Language', value: 'English', arrow: true, action: null },
                ],
            },
            {
                title: 'Storage',
                rows: [{ icon: <StorageIcon />, label: 'Cache & Storage', value: '', arrow: true, action: null }],
            },
            {
                title: 'Support',
                rows: [
                    { icon: <HelpIcon />, label: 'Ask a Question', value: '', arrow: true, action: null },
                    { icon: <InfoIcon />, label: 'Telegram Features', value: '', arrow: true, action: null },
                ],
            },
        ];

        return (
            <div className='android-settings-overlay'>
                <div className='android-settings-toolbar'>
                    <button className='android-settings-back' onClick={onClose}>
                        <ArrowBackIcon />
                    </button>
                    <span className='android-settings-toolbar-title'>Settings</span>
                </div>

                <div className='android-settings-content'>
                    {/* Profile card */}
                    <div className='android-settings-profile'>
                        <div className='android-settings-avatar'>
                            {avatarSrc ? <img src={avatarSrc} alt='' /> : initials}
                        </div>
                        <div className='android-settings-profile-info'>
                            <div className='android-settings-profile-name'>{name}</div>
                            {phone && <div className='android-settings-profile-phone'>{phone}</div>}
                            {username && <div className='android-settings-profile-bio'>{username}</div>}
                        </div>
                        <div className='android-settings-row-arrow'>
                            <ChevronRightIcon />
                        </div>
                    </div>

                    {sections.map(section => (
                        <div key={section.title} className='android-settings-section'>
                            <div className='android-settings-section-title'>{section.title}</div>
                            {section.rows.map((row, i) => (
                                <React.Fragment key={row.label}>
                                    <button className='android-settings-row' onClick={row.action || undefined}>
                                        <span className='android-settings-row-icon'>{row.icon}</span>
                                        <span className='android-settings-row-content'>
                                            <span className='android-settings-row-label'>{row.label}</span>
                                            {row.value && (
                                                <span className='android-settings-row-value'>{row.value}</span>
                                            )}
                                        </span>
                                        {row.toggle && (
                                            <span className={`android-settings-toggle${row.toggleOn ? ' on' : ''}`} />
                                        )}
                                        {row.arrow && (
                                            <span className='android-settings-row-arrow'>
                                                <ChevronRightIcon />
                                            </span>
                                        )}
                                    </button>
                                    {i < section.rows.length - 1 && <div className='android-settings-divider' />}
                                </React.Fragment>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}

export default AndroidSettings;
