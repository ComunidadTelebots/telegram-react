import React from 'react';
import PersonIcon from '@material-ui/icons/Person';
import PhoneIcon from '@material-ui/icons/Phone';
import ChatIcon from '@material-ui/icons/Chat';
import SettingsIcon from '@material-ui/icons/Settings';
import './AndroidBottomNav.css';

function AndroidBottomNav({ active = 'chats', onSelect }) {
    const items = [
        { key: 'contacts', label: 'Contacts', icon: <PersonIcon /> },
        { key: 'calls', label: 'Calls', icon: <PhoneIcon /> },
        { key: 'chats', label: 'Chats', icon: <ChatIcon /> },
        { key: 'settings', label: 'Settings', icon: <SettingsIcon /> },
    ];

    return (
        <div className='android-bottom-nav'>
            {items.map(({ key, label, icon }) => (
                <button
                    key={key}
                    className={`android-bottom-nav-item${active === key ? ' active' : ''}`}
                    onClick={() => onSelect && onSelect(key)}>
                    {icon}
                    <span>{label}</span>
                </button>
            ))}
        </div>
    );
}

export default AndroidBottomNav;
