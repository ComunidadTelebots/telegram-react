import React from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import EditIcon from '@material-ui/icons/Edit';
import NotificationsIcon from '@material-ui/icons/Notifications';
import LockIcon from '@material-ui/icons/Lock';
import DataUsageIcon from '@material-ui/icons/DataUsage';
import ChatBubbleIcon from '@material-ui/icons/ChatBubble';
import PaletteIcon from '@material-ui/icons/Palette';
import LanguageIcon from '@material-ui/icons/Language';
import HelpIcon from '@material-ui/icons/Help';
import InfoIcon from '@material-ui/icons/Info';
import Brightness2Icon from '@material-ui/icons/Brightness2';
import WbSunnyIcon from '@material-ui/icons/WbSunny';
import StorageIcon from '@material-ui/icons/Storage';
import FolderIcon from '@material-ui/icons/Folder';
import PhoneAndroidIcon from '@material-ui/icons/PhoneAndroid';
import StarIcon from '@material-ui/icons/Star';
import EmojiEmotionsIcon from '@material-ui/icons/EmojiEmotions';
import GroupIcon from '@material-ui/icons/Group';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import CropFreeIcon from '@material-ui/icons/CropFree';
import Snackbar from '@material-ui/core/Snackbar';
import TwoStepVerification from '../Additional/TwoStepVerification';
import ActiveSessions from '../Additional/ActiveSessions';
import EditProfile from '../Additional/EditProfile';
import PrivacySettings from './PrivacySettings';
import { getSrc } from '../../Utils/File';
import { getUserFullName } from '../../Utils/User';
import UserStore from '../../Stores/UserStore';
import OptionStore from '../../Stores/OptionStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import { getDesign } from '../../Design';
import './AndroidSettings.css';

function isHoloOrClassic(d) {
    return d === 'android-holo' || d === 'android-classic';
}
function isNewEra(d) {
    return d === 'android-glass' || d === 'android';
}

class AndroidSettings extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            isDark: document.body.classList.contains('theme-dark'),
            design: getDesign(),
            bio: '',
            snackbar: null,
        };
    }

    componentDidMount() {
        this.loadBio();
        ApplicationStore.on('clientUpdateThemeChange', this.onDesignChange);
    }

    componentWillUnmount() {
        ApplicationStore.off('clientUpdateThemeChange', this.onDesignChange);
    }

    onDesignChange = () => this.setState({ design: getDesign() });

    async loadBio() {
        const myId = OptionStore.get('my_id');
        if (!myId || !myId.value) return;
        try {
            const full = await TdLibController.send({ '@type': 'getUserFullInfo', user_id: myId.value });
            if (full && full.bio) this.setState({ bio: full.bio.text || full.bio || '' });
        } catch {}
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

    handleLogOut = () => {
        this.props.onClose();
        TdLibController.send({ '@type': 'logOut' });
    };

    handleTwoStepVerification = () => {
        if (this.twoStepRef) this.twoStepRef.open();
    };

    handleDevices = () => {
        if (this.activeSessionsRef) this.activeSessionsRef.open();
    };

    handlePrivacy = () => {
        if (this.privacySettingsRef) this.privacySettingsRef.open();
    };

    handleEditProfile = () => {
        if (this.editProfileRef) this.editProfileRef.open();
    };

    handleSoon = label => {
        this.setState({ snackbar: `${label} — próximamente` });
    };

    render() {
        const { onClose } = this.props;
        const { isDark, design, bio } = this.state;
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
        const isOld = isHoloOrClassic(design);
        const isNew = isNewEra(design);

        // Secciones que varían por era
        const sections = [
            // Cuenta — siempre presente
            {
                key: 'account',
                rows: [
                    {
                        icon: <NotificationsIcon />,
                        label: 'Notifications and Sounds',
                        sub: '',
                        arrow: true,
                        action: () => this.handleSoon('Notifications and Sounds'),
                    },
                    {
                        icon: <LockIcon />,
                        label: 'Privacy and Security',
                        sub: 'Privacy settings',
                        arrow: true,
                        action: this.handlePrivacy,
                    },
                    {
                        icon: <DataUsageIcon />,
                        label: 'Data and Storage',
                        sub: '',
                        arrow: true,
                        action: () => this.handleSoon('Data and Storage'),
                    },
                    {
                        icon: <ChatBubbleIcon />,
                        label: 'Chat Settings',
                        sub: '',
                        arrow: true,
                        action: () => this.handleSoon('Chat Settings'),
                    },
                    ...(isOld
                        ? []
                        : [
                              {
                                  icon: <FolderIcon />,
                                  label: 'Chat Folders',
                                  sub: '',
                                  arrow: true,
                                  action: () => this.handleSoon('Chat Folders'),
                              },
                          ]),
                ],
            },
            // Dispositivos — desde v9 en adelante
            ...(!isHoloOrClassic(design)
                ? [
                      {
                          key: 'devices',
                          rows: [
                              {
                                  icon: <PhoneAndroidIcon />,
                                  label: 'Devices',
                                  sub: 'Active sessions',
                                  arrow: true,
                                  action: this.handleDevices,
                              },
                          ],
                      },
                  ]
                : []),
            // Premium — solo en eras modernas
            ...(isNew
                ? [
                      {
                          key: 'premium',
                          rows: [
                              {
                                  icon: <StarIcon />,
                                  label: 'Telegram Premium',
                                  sub: 'Exclusive features',
                                  arrow: true,
                                  accent: true,
                              },
                              { icon: <EmojiEmotionsIcon />, label: 'Stickers & Emoji', sub: '', arrow: true },
                          ],
                      },
                  ]
                : []),
            // Display
            {
                key: 'display',
                rows: [
                    {
                        icon: isDark ? <WbSunnyIcon /> : <Brightness2Icon />,
                        label: 'Night Mode',
                        toggle: true,
                        toggleOn: isDark,
                        action: this.handleToggleDark,
                    },
                    {
                        icon: <PaletteIcon />,
                        label: 'Appearance',
                        sub: 'Design & Theme',
                        arrow: true,
                        action: this.props.onAppearance,
                    },
                    { icon: <LanguageIcon />, label: 'Language', sub: 'English', arrow: true },
                ],
            },
            // Invitar amigos — vieja era lo tenía aquí
            ...(isOld
                ? [
                      {
                          key: 'invite',
                          rows: [
                              { icon: <PersonAddIcon />, label: 'Invite Friends', sub: '', arrow: true },
                              { icon: <GroupIcon />, label: 'Telegram Features', sub: '', arrow: true },
                          ],
                      },
                  ]
                : []),
            // Almacenamiento
            {
                key: 'storage',
                rows: [{ icon: <StorageIcon />, label: 'Storage and Data', sub: '', arrow: true }],
            },
            // Soporte
            {
                key: 'help',
                rows: [
                    { icon: <HelpIcon />, label: 'Ask a Question', sub: '', arrow: true },
                    { icon: <InfoIcon />, label: 'Telegram Features', sub: '', arrow: true },
                ],
            },
        ];

        return (
            <>
                <div className='android-settings-overlay'>
                    {/* Toolbar */}
                    <div className='android-settings-toolbar'>
                        <button className='android-settings-back' onClick={onClose} aria-label='Back'>
                            <ArrowBackIcon />
                        </button>
                        <span className='android-settings-toolbar-title'>Settings</span>
                        <button className='android-settings-toolbar-action' aria-label='Edit'>
                            <EditIcon style={{ fontSize: 20 }} />
                        </button>
                        {!isOld && (
                            <button className='android-settings-toolbar-action' aria-label='QR'>
                                <CropFreeIcon style={{ fontSize: 20 }} />
                            </button>
                        )}
                    </div>

                    <div className='android-settings-content'>
                        {/* Profile hero */}
                        <div
                            className='android-settings-profile'
                            onClick={this.handleEditProfile}
                            style={{ cursor: 'pointer' }}>
                            <div className='android-settings-avatar'>
                                {avatarSrc ? <img src={avatarSrc} alt='' /> : initials}
                            </div>
                            <div className='android-settings-profile-info'>
                                <div className='android-settings-profile-name'>{name}</div>
                                {bio ? (
                                    <div className='android-settings-profile-bio'>{bio}</div>
                                ) : username ? (
                                    <div className='android-settings-profile-bio'>{username}</div>
                                ) : null}
                                {phone && <div className='android-settings-profile-phone'>{phone}</div>}
                            </div>
                        </div>

                        {/* Sections */}
                        {sections.map(section => (
                            <div key={section.key} className='android-settings-section'>
                                {section.rows.map((row, i) => (
                                    <React.Fragment key={row.label}>
                                        <button
                                            className={`android-settings-row${
                                                row.accent ? ' android-settings-row--accent' : ''
                                            }`}
                                            onClick={row.action || undefined}>
                                            <span className={`android-settings-row-icon${row.accent ? ' accent' : ''}`}>
                                                {row.icon}
                                            </span>
                                            <span className='android-settings-row-content'>
                                                <span className='android-settings-row-label'>{row.label}</span>
                                                {row.sub && (
                                                    <span className='android-settings-row-value'>{row.sub}</span>
                                                )}
                                            </span>
                                            {row.toggle !== undefined ? (
                                                <span
                                                    className={`android-settings-toggle${row.toggleOn ? ' on' : ''}`}
                                                />
                                            ) : row.arrow ? (
                                                <span className='android-settings-row-arrow'>
                                                    <ChevronRightIcon />
                                                </span>
                                            ) : null}
                                        </button>
                                        {i < section.rows.length - 1 && <div className='android-settings-divider' />}
                                    </React.Fragment>
                                ))}
                            </div>
                        ))}

                        {/* Log out */}
                        <div className='android-settings-section android-settings-section--danger'>
                            <button
                                className='android-settings-row android-settings-row--danger'
                                onClick={this.handleLogOut}>
                                <span className='android-settings-row-icon android-settings-row-icon--danger'>
                                    <ExitToAppIcon />
                                </span>
                                <span className='android-settings-row-content'>
                                    <span className='android-settings-row-label android-settings-row-label--danger'>
                                        Log Out
                                    </span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
                <TwoStepVerification ref={ref => (this.twoStepRef = ref)} />
                <ActiveSessions ref={ref => (this.activeSessionsRef = ref)} />
                <EditProfile ref={ref => (this.editProfileRef = ref)} />
                <PrivacySettings ref={ref => (this.privacySettingsRef = ref)} />
                <Snackbar
                    open={!!this.state.snackbar}
                    message={this.state.snackbar || ''}
                    autoHideDuration={3000}
                    onClose={() => this.setState({ snackbar: null })}
                />
            </>
        );
    }
}

export default AndroidSettings;
