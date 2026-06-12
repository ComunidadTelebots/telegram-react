import React, { Component } from 'react';
import UserTile from '../Tile/UserTile';
import UserStore from '../../Stores/UserStore';
import './MentionAutocomplete.css';

class MentionAutocomplete extends Component {
    render() {
        const { members, query, onSelect } = this.props;
        if (!members || members.length === 0) return null;

        const q = (query || '').toLowerCase();
        const filtered = q
            ? members.filter(m => {
                  const user = UserStore.get(m.user_id || m.member_id?.user_id);
                  if (!user) return false;
                  const name = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
                  const username = (user.username || '').toLowerCase();
                  return name.includes(q) || username.includes(q);
              })
            : members;

        if (filtered.length === 0) return null;

        return (
            <div className='mention-autocomplete'>
                {filtered.slice(0, 8).map(m => {
                    const uid = m.user_id || m.member_id?.user_id;
                    const user = UserStore.get(uid);
                    if (!user) return null;
                    const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
                    const username = user.username ? `@${user.username}` : '';
                    return (
                        <div
                            key={uid}
                            className='mention-item'
                            onMouseDown={e => {
                                e.preventDefault();
                                onSelect(user);
                            }}>
                            <span className='mention-avatar'>
                                <UserTile userId={uid} small />
                            </span>
                            <span className='mention-name'>{name}</span>
                            {username && <span className='mention-username'>{username}</span>}
                        </div>
                    );
                })}
            </div>
        );
    }
}

export default MentionAutocomplete;
