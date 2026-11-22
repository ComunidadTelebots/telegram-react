import ReadingLibrary from '../AmpViewer/ReadingLibrary';
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
import HistoryIcon from '@material-ui/icons/History';
import TuneIcon from '@material-ui/icons/Tune';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import { openChat } from '../../Actions/Client';
import Snackbar from '@material-ui/core/Snackbar';
import TwoStepVerification from '../Additional/TwoStepVerification';
import ActiveSessions from '../Additional/ActiveSessions';
import EditProfile from '../Additional/EditProfile';
import PrivacySettings from './PrivacySettings';
import LanguagePicker from './LanguagePicker';
import AndroidDataSettings from './AndroidDataSettings';
import PlusOptionsDialog from './PlusOptionsDialog';
import FavedStickers from '../Additional/FavedStickers';
import { getSrc } from '../../Utils/File';
import { getUserFullName } from '../../Utils/User';
import UserStore from '../../Stores/UserStore';
import OptionStore from '../../Stores/OptionStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import { getDesign, setEraFeatures, usesEraFeatures } from '../../Design';
import './AndroidSettings.css';

function isHoloOrClassic(d) {
    return d === 'android-holo' || d === 'android-classic';
}
class AndroidSettings extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            isDark: document.body.classList.contains('theme-dark'),
            design: getDesign(),
            bio: '',
            snackbar: null,
            legacyOnly: usesEraFeatures(),
        };
    }

    componentDidMount() {
        this.loadBio();
        ApplicationStore.on('clientUpdateDesignCapabilities', this.onCapabilitiesChange);
        ApplicationStore.on('clientUpdateThemeChange', this.onDesignChange);
    }

    componentWillUnmount() {
        ApplicationStore.off('clientUpdateDesignCapabilities', this.onCapabilitiesChange);
        ApplicationStore.off('clientUpdateThemeChange', this.onDesignChange);
    }

    onCapabilitiesChange = ({ legacyOnly }) => this.setState({ legacyOnly });

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

    openCommunityChannel = async () => {
        try {
            const chat = await TdLibController.send({ '@type': 'searchPublicChat', username: 'comunidadtelebots' });
            if (!chat || !chat.id) throw new Error();
            this.setState({ communityOpen: false });
            this.props.onClose();
            openChat(chat.id);
        } catch {
            this.setState({ snackbar: 'No se ha podido abrir el canal. Vuelve a intentarlo.' });
        }
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

    handleNotifications = async () => {
        if (!('Notification' in window)) {
            this.setState({ snackbar: 'Este navegador no admite notificaciones.' });
            return;
        }
        const permission =
            Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
        const labels = { granted: 'Notificaciones activadas', denied: 'Notificaciones bloqueadas por el navegador' };
        this.setState({ snackbar: labels[permission] || 'Permiso de notificaciones pendiente' });
    };

    handleChatSettings = () => {
        if (this.props.onAppearance) this.props.onAppearance();
    };

    handleChatFolders = () => {
        this.props.onClose();
        ApplicationStore.emit('clientUpdateOpenCreateFolder');
    };

    handleStorage = async () => {
        if (this.dataSettingsRef) this.dataSettingsRef.open();
    };

    handleFavoriteStickers = () => {
        if (this.favedStickersRef) this.favedStickersRef.open();
    };

    handleToggleLegacyFeatures = () => {
        const next = !usesEraFeatures();
        setEraFeatures(next);
        ApplicationStore.emit('clientUpdateDesignCapabilities', { legacyOnly: next });
    };

    handleLanguage = () => {
        if (this.languagePickerRef) this.languagePickerRef.open();
    };

    handlePlusOptions = () => {
        if (this.plusOptionsRef) this.plusOptionsRef.open();
    };

    openHelp = path => window.open(`https://telegram.org/${path}`, '_blank', 'noopener,noreferrer');

    render() {
        const { onClose } = this.props;
        const { isDark, design, bio, legacyOnly } = this.state;
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
        const androidEra = {
            'android-v1': 1, 'android-v2': 2, 'android-v3': 3, 'android-v35': 3.5,
            'android-v4': 4, 'android-holo': 4, 'android-v5': 5,
            'android-v9': 6, 'android-classic': 7, 'android-v8': 8, 'android-v11': 8,
        }[design] ?? Infinity;
        const supports = firstEra => !legacyOnly || androidEra >= firstEra;
        const isOld = isHoloOrClassic(design);

        // Secciones que varían por era
        const sections = [
            // Cuenta — siempre presente
            {
                key: 'account',
                rows: [
                    {
                        icon: <GroupIcon />,
                        label: 'Comunidad Telebots',
                        sub: 'Bots, comunidad, novedades y recursos',
                        arrow: true,
                        action: () => this.setState({ communityOpen: true }),
                    },
                    {
                        icon: <NotificationsIcon />,
                        label: 'Notificaciones y sonidos',
                        sub: '',
                        arrow: true,
                        action: this.handleNotifications,
                    },
                    {
                        icon: <LockIcon />,
                        label: 'Privacidad y seguridad',
                        sub: 'Configuración de privacidad',
                        arrow: true,
                        action: this.handlePrivacy,
                    },
                    {
                        icon: <DataUsageIcon />,
                        label: 'Datos y almacenamiento',
                        sub: '',
                        arrow: true,
                        action: this.handleStorage,
                    },
                    {
                        icon: <ChatBubbleIcon />,
                        label: 'Ajustes de chat',
                        sub: 'Texto, densidad y animaciones',
                        arrow: true,
                        action: this.handleChatSettings,
                    },
                    ...(!supports(6)
                        ? []
                        : [
                              {
                                  icon: <FolderIcon />,
                                  label: 'Carpetas de chat',
                                  sub: 'Crear y organizar carpetas',
                                  arrow: true,
                                  action: this.handleChatFolders,
                              },
                          ]),
                ],
            },
            // Dispositivos — desde v9 en adelante
            ...(supports(3)
                ? [
                      {
                          key: 'devices',
                          rows: [
                              {
                                  icon: <PhoneAndroidIcon />,
                                  label: 'Dispositivos',
                                  sub: 'Sesiones activas',
                                  arrow: true,
                                  action: this.handleDevices,
                              },
                          ],
                      },
                  ]
                : []),
            ...(supports(4)
                ? [
                      {
                          key: 'premium',
                          rows: [
                              {
                                  hidden: !supports(9),
                                  icon: <StarIcon />,
                                  label: 'Telegram Premium',
                                  sub: 'Exclusive features',
                                  arrow: true,
                                  accent: true,
                              },
                              {
                                  icon: <EmojiEmotionsIcon />,
                                  label: 'Stickers & Emoji',
                                  sub: 'Stickers favoritos',
                                  arrow: true,
                                  action: this.handleFavoriteStickers,
                              },
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
                        label: 'Modo nocturno',
                        toggle: true,
                        toggleOn: isDark,
                        action: this.handleToggleDark,
                    },
                    {
                        icon: <PaletteIcon />,
                        label: 'Apariencia',
                        sub: 'Diseño y tema',
                        arrow: true,
                        action: this.props.onAppearance,
                    },
                    {
                        icon: <LanguageIcon />,
                        label: 'Idioma',
                        sub: 'Español',
                        arrow: true,
                        action: this.handleLanguage,
                    },
                    {
                        icon: <TuneIcon />,
                        label: 'Opciones Plus Messenger',
                        sub: 'Organización, accesos rápidos, multimedia y privacidad',
                        arrow: true,
                        action: this.handlePlusOptions,
                    },
                    {
                        icon: <HistoryIcon />,
                        label: 'Solo funciones de la época',
                        sub: legacyOnly ? 'Activado · API moderna' : 'Desactivado · funciones actuales',
                        toggle: true,
                        toggleOn: legacyOnly,
                        action: this.handleToggleLegacyFeatures,
                    },
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
                rows: [
                    {
                        icon: <StorageIcon />,
                        label: 'Almacenamiento y datos',
                        sub: '',
                        arrow: true,
                        action: this.handleStorage,
                    },
                ],
            },
            // Soporte
            {
                key: 'help',
                rows: [
                    {
                        icon: <HelpIcon />,
                        label: 'Ask a Question',
                        sub: '',
                        arrow: true,
                        action: () => this.openHelp('support'),
                    },
                    {
                        icon: <InfoIcon />,
                        label: 'Telegram Features',
                        sub: '',
                        arrow: true,
                        action: () => this.openHelp('faq'),
                    },
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
                        <span className='android-settings-toolbar-title'>Ajustes</span>
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
                                {section.rows.filter(row => !row.hidden).map((row, i) => (
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
                                        Cerrar sesión
                                    </span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
                <Dialog fullWidth maxWidth='xs' PaperProps={{ className: 'telebots-community-panel' }} open={Boolean(this.state.communityOpen)} onClose={() => this.setState({ communityOpen: false })} aria-labelledby='community-title'>
                    <DialogTitle id='community-title'>Comunidad Telebots</DialogTitle>
                    <DialogContent>
                        {this.props.onAppearance && <Button onClick={() => this.setState({ communityOpen: false }, this.handleChatSettings)}>Apariencia</Button>}
                        <Button onClick={() => this.setState({ communityOpen: false }, this.handlePrivacy)}>Privacidad</Button>
                        <Button href='https://chat.todosobreall.tech/access/' target='_blank' rel='noopener noreferrer'>Panel de acceso</Button>
                        <Button href='https://chat.todosobreall.tech/access/privacy' target='_blank' rel='noopener noreferrer'>Política de privacidad</Button>
                        <Button href='https://chat.todosobreall.tech/access/terms' target='_blank' rel='noopener noreferrer'>Condiciones del servicio</Button>
                        <Button onClick={() => this.setState({ communityOpen: false, libraryOpen: true })}>Biblioteca de lectura</Button>
                        <Button onClick={this.openCommunityChannel}>Canal oficial · @comunidadtelebots</Button>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => this.setState({ communityOpen: false })}>Cerrar</Button>
                    </DialogActions>
                </Dialog>
                {this.state.libraryOpen && <ReadingLibrary key={OptionStore.get('my_id')?.value} account={OptionStore.get('my_id')?.value} onClose={() => this.setState({ libraryOpen: false })} />}
                <TwoStepVerification ref={ref => (this.twoStepRef = ref)} />
                <ActiveSessions ref={ref => (this.activeSessionsRef = ref)} />
                <EditProfile ref={ref => (this.editProfileRef = ref)} />
                <PrivacySettings ref={ref => (this.privacySettingsRef = ref)} />
                <LanguagePicker ref={ref => (this.languagePickerRef = ref)} />
                <AndroidDataSettings ref={ref => (this.dataSettingsRef = ref)} />
                <PlusOptionsDialog ref={ref => (this.plusOptionsRef = ref)} />
                <FavedStickers ref={ref => (this.favedStickersRef = ref)} />
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
