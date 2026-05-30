import React from 'react';
import GroupIcon from '@material-ui/icons/Group';
import PersonIcon from '@material-ui/icons/Person';
import PhoneIcon from '@material-ui/icons/Phone';
import NearMeIcon from '@material-ui/icons/NearMe';
import BookmarkIcon from '@material-ui/icons/Bookmark';
import SettingsIcon from '@material-ui/icons/Settings';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import Brightness2Icon from '@material-ui/icons/Brightness2';
import WbSunnyIcon from '@material-ui/icons/WbSunny';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import { getSrc } from '../../Utils/File';
import { getUserFullName } from '../../Utils/User';
import UserStore from '../../Stores/UserStore';
import OptionStore from '../../Stores/OptionStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './AndroidDrawer.css';

class AndroidDrawer extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = { isDark: document.body.classList.contains('theme-dark') };
    }

    getMe() {
        const myId = OptionStore.get('my_id');
        if (!myId || !myId.value) return null;
        return UserStore.get(myId.value);
    }

    handleToggleDark = () => {
        const isDark = !this.state.isDark;
        this.setState({ isDark });
        const type = isDark ? 'dark' : 'light';
        ApplicationStore.emit('clientUpdateThemeChanging', { type, primary: { main: '#229af0' } });
    };

    handleNewGroup = () => {
        this.props.onClose();
        TdLibController.clientUpdate({ '@type': 'clientUpdateNewGroup' });
    };

    handleSavedMessages = async () => {
        this.props.onClose();
        const myId = OptionStore.get('my_id');
        if (!myId || !myId.value) return;
        try {
            const chat = await TdLibController.send({ '@type': 'createPrivateChat', user_id: myId.value, force: true });
            TdLibController.setChatId(chat.id);
        } catch {}
    };

    handleSettings = () => {
        this.props.onClose();
        TdLibController.clientUpdate({ '@type': 'clientUpdateAppearance' });
    };

    handleLogOut = () => {
        this.props.onClose();
        TdLibController.send({ '@type': 'logOut' });
    };

    render() {
        const { onClose } = this.props;
        const { isDark } = this.state;
        const me = this.getMe();
        const name = me ? getUserFullName(me) : 'Telegram';
        const phone = me ? (me.phone_number ? '+' + me.phone_number : '') : '';
        const initials = name
            ? name
                  .split(' ')
                  .map(w => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
            : 'TG';
        const avatarSrc = me ? getSrc(me.profile_photo ? me.profile_photo.small : null) : null;

        const items = [
            { icon: <GroupIcon />, label: 'New Group', action: this.handleNewGroup },
            { icon: <PersonIcon />, label: 'Contacts', action: onClose },
            { icon: <PhoneIcon />, label: 'Calls', action: onClose },
            { icon: <NearMeIcon />, label: 'People Nearby', action: onClose },
            { icon: <BookmarkIcon />, label: 'Saved Messages', action: this.handleSavedMessages },
            { icon: <SettingsIcon />, label: 'Settings', action: this.handleSettings },
            { icon: <PersonAddIcon />, label: 'Invite Friends', action: onClose },
            { icon: <HelpOutlineIcon />, label: 'Telegram Features', action: onClose },
        ];

        return (
            <div className='android-drawer-overlay'>
                <div className='android-drawer-backdrop' onClick={onClose} />
                <div className='android-drawer-panel'>
                    <div className='android-drawer-header'>
                        <div className='android-drawer-header-bg' />
                        <button className='android-drawer-darkmode-btn' onClick={this.handleToggleDark}>
                            {isDark ? <WbSunnyIcon fontSize='small' /> : <Brightness2Icon fontSize='small' />}
                        </button>
                        <div className='android-drawer-avatar'>
                            {avatarSrc ? <img src={avatarSrc} alt='' /> : initials}
                        </div>
                        <div className='android-drawer-name'>{name}</div>
                        {phone && <div className='android-drawer-phone'>{phone}</div>}
                    </div>

                    <div className='android-drawer-list'>
                        {items.map(({ icon, label, action }) => (
                            <button key={label} className='android-drawer-item' onClick={action}>
                                <span className='android-drawer-icon'>{icon}</span>
                                {label}
                            </button>
                        ))}
                        <div className='android-drawer-divider' />
                        <button className='android-drawer-item android-drawer-item--logout' onClick={this.handleLogOut}>
                            <span className='android-drawer-icon'>
                                <ExitToAppIcon />
                            </span>
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default AndroidDrawer;
