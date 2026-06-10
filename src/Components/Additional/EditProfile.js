import React, { Component } from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import TdLibController from '../../Controllers/TdLibController';
import UserStore from '../../Stores/UserStore';
import OptionStore from '../../Stores/OptionStore';
import { getUserFullName } from '../../Utils/User';
import './EditProfile.css';

class EditProfile extends Component {
    constructor(props) {
        super(props);
        this.state = { open: false, firstName: '', lastName: '', username: '', bio: '', saving: false, error: '' };
    }

    open() {
        const myId = OptionStore.get('my_id');
        const me = myId && myId.value ? UserStore.get(myId.value) : null;
        this.setState({
            open: true,
            firstName: me ? me.first_name || '' : '',
            lastName: me ? me.last_name || '' : '',
            username: me ? me.username || '' : '',
            bio: '',
            saving: false,
            error: '',
        });
        if (myId && myId.value) {
            TdLibController.send({ '@type': 'getUserFullInfo', user_id: myId.value })
                .then(full => {
                    if (full && full.bio) this.setState({ bio: full.bio.text || full.bio || '' });
                })
                .catch(() => {});
        }
    }

    close = () => this.setState({ open: false });

    handleSave = async () => {
        const { firstName, lastName, username, bio } = this.state;
        if (!firstName.trim()) {
            this.setState({ error: 'El nombre no puede estar vacío.' });
            return;
        }
        this.setState({ saving: true, error: '' });
        try {
            await TdLibController.send({
                '@type': 'setName',
                first_name: firstName.trim(),
                last_name: lastName.trim(),
            });
            await TdLibController.send({ '@type': 'setBio', bio: bio.trim() });
            if (username.trim()) {
                await TdLibController.send({ '@type': 'setUsername', username: username.trim() });
            }
            this.setState({ saving: false });
            this.close();
        } catch (e) {
            this.setState({ saving: false, error: e.message || 'Error al guardar.' });
        }
    };

    render() {
        const { open, firstName, lastName, username, bio, saving, error } = this.state;
        if (!open) return null;
        return (
            <div className='edit-profile-overlay'>
                <div className='edit-profile-panel'>
                    <div className='edit-profile-header'>
                        <IconButton onClick={this.close} size='small'>
                            <ArrowBackIcon />
                        </IconButton>
                        <span className='edit-profile-title'>Edit Profile</span>
                        {saving ? (
                            <CircularProgress size={22} style={{ marginLeft: 'auto', marginRight: 8 }} />
                        ) : (
                            <Button color='primary' onClick={this.handleSave} style={{ marginLeft: 'auto' }}>
                                Save
                            </Button>
                        )}
                    </div>
                    <div className='edit-profile-body'>
                        {error && <div className='edit-profile-error'>{error}</div>}
                        <TextField
                            label='First name'
                            value={firstName}
                            onChange={e => this.setState({ firstName: e.target.value })}
                            fullWidth
                            margin='normal'
                            inputProps={{ maxLength: 64 }}
                        />
                        <TextField
                            label='Last name'
                            value={lastName}
                            onChange={e => this.setState({ lastName: e.target.value })}
                            fullWidth
                            margin='normal'
                            inputProps={{ maxLength: 64 }}
                        />
                        <TextField
                            label='Bio'
                            value={bio}
                            onChange={e => this.setState({ bio: e.target.value })}
                            fullWidth
                            multiline
                            rows={3}
                            margin='normal'
                            inputProps={{ maxLength: 70 }}
                            helperText={`${bio.length}/70`}
                        />
                        <TextField
                            label='Username'
                            value={username}
                            onChange={e => this.setState({ username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                            fullWidth
                            margin='normal'
                            inputProps={{ maxLength: 32 }}
                            helperText='Solo letras, números y guión bajo. Mínimo 5 caracteres.'
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default EditProfile;
