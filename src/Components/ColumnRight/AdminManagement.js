import React from 'react';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import CloseIcon from '@material-ui/icons/Close';
import TdLibController from '../../Controllers/TdLibController';
import './AdminManagement.css';

const RIGHTS = [
    { key: 'change_info', label: 'Cambiar info del grupo' },
    { key: 'post_messages', label: 'Enviar mensajes' },
    { key: 'edit_messages', label: 'Editar mensajes' },
    { key: 'delete_messages', label: 'Eliminar mensajes' },
    { key: 'ban_users', label: 'Banear usuarios' },
    { key: 'invite_users', label: 'Invitar usuarios' },
    { key: 'pin_messages', label: 'Fijar mensajes' },
    { key: 'add_admins', label: 'Añadir admins' },
    { key: 'anonymous', label: 'Anónimo' },
    { key: 'manage_call', label: 'Gestionar llamadas' },
];

class AdminManagement extends React.Component {
    state = {
        open: false,
        chatId: null,
        admins: [],
        users: [],
        loading: false,
        editingAdmin: null,
        editRights: {},
        editRank: '',
        saving: false,
    };

    open(chatId) {
        this.setState({ open: true, chatId, admins: [], users: [], loading: true, editingAdmin: null });
        TdLibController.send({ '@type': 'getChannelAdmins', chat_id: chatId })
            .then(r => this.setState({ admins: r.admins || [], users: r.users || [], loading: false }))
            .catch(() => this.setState({ loading: false }));
    }

    handleClose = () => this.setState({ open: false });

    handleEditAdmin = admin => {
        const rights = admin.admin_rights || {};
        this.setState({
            editingAdmin: admin,
            editRights: { ...rights },
            editRank: admin.rank || '',
        });
    };

    handleToggleRight = key => {
        this.setState(prev => ({
            editRights: { ...prev.editRights, [key]: !prev.editRights[key] },
        }));
    };

    handleSaveAdmin = async () => {
        const { chatId, editingAdmin, editRights, editRank } = this.state;
        this.setState({ saving: true });
        try {
            await TdLibController.send({
                '@type': 'editAdmin',
                chat_id: chatId,
                user_id: editingAdmin.user_id,
                admin_rights: editRights,
                rank: editRank,
            });
            this.setState({ editingAdmin: null, saving: false });
            this.open(chatId);
        } catch (e) {
            this.setState({ saving: false });
        }
    };

    handleRemoveAdmin = async admin => {
        const { chatId } = this.state;
        try {
            await TdLibController.send({
                '@type': 'editAdmin',
                chat_id: chatId,
                user_id: admin.user_id,
                admin_rights: {},
                rank: '',
            });
            this.open(chatId);
        } catch (e) {}
    };

    getUserName(userId) {
        const u = this.state.users.find(x => x.id === userId);
        if (!u) return `User ${userId}`;
        return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || `User ${userId}`;
    }

    render() {
        const { open, loading, admins, editingAdmin, editRights, editRank, saving } = this.state;
        if (!open) return null;

        return (
            <div className='admin-mgmt-overlay'>
                <div className='admin-mgmt-panel'>
                    <div className='admin-mgmt-toolbar'>
                        <span className='admin-mgmt-title'>Administradores</span>
                        <IconButton size='small' onClick={this.handleClose}>
                            <CloseIcon />
                        </IconButton>
                    </div>

                    {editingAdmin ? (
                        <div className='admin-mgmt-edit'>
                            <div className='admin-mgmt-edit-name'>{this.getUserName(editingAdmin.user_id)}</div>
                            <TextField
                                label='Título'
                                value={editRank}
                                onChange={e => this.setState({ editRank: e.target.value })}
                                fullWidth
                                margin='dense'
                                variant='outlined'
                                inputProps={{ maxLength: 16 }}
                            />
                            <div className='admin-mgmt-rights'>
                                {RIGHTS.map(r => (
                                    <FormControlLabel
                                        key={r.key}
                                        control={
                                            <Checkbox
                                                checked={!!editRights[r.key]}
                                                onChange={() => this.handleToggleRight(r.key)}
                                                color='primary'
                                                size='small'
                                            />
                                        }
                                        label={r.label}
                                    />
                                ))}
                            </div>
                            <div className='admin-mgmt-edit-actions'>
                                <Button onClick={() => this.setState({ editingAdmin: null })} size='small'>
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={this.handleSaveAdmin}
                                    color='primary'
                                    variant='contained'
                                    size='small'
                                    disabled={saving}>
                                    {saving ? 'Guardando…' : 'Guardar'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className='admin-mgmt-list'>
                            {loading && <div className='admin-mgmt-loading'>Cargando…</div>}
                            {admins.map((admin, i) => (
                                <div key={admin.user_id || i} className='admin-mgmt-item'>
                                    <div className='admin-mgmt-item-info'>
                                        <span className='admin-mgmt-item-name'>{this.getUserName(admin.user_id)}</span>
                                        {admin.rank && <span className='admin-mgmt-item-rank'>{admin.rank}</span>}
                                    </div>
                                    <div className='admin-mgmt-item-actions'>
                                        <Button size='small' onClick={() => this.handleEditAdmin(admin)}>
                                            Editar
                                        </Button>
                                        {!admin.is_self && (
                                            <Button
                                                size='small'
                                                style={{ color: '#e53935' }}
                                                onClick={() => this.handleRemoveAdmin(admin)}>
                                                Quitar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default AdminManagement;
