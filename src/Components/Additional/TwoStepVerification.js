/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import TdLibController from '../../Controllers/TdLibController';

class TwoStepVerification extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            loading: false,
            hasPassword: null,
            passwordHint: '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            hint: '',
            error: '',
            success: '',
            mode: 'view', // 'view' | 'set' | 'change' | 'disable'
        };
    }

    open = async () => {
        this.setState({ open: true, loading: true, error: '', success: '', mode: 'view' });
        try {
            const result = await TdLibController.send({ '@type': 'getTwoStepVerificationStatus' });
            this.setState({
                hasPassword: result.has_password,
                passwordHint: result.password_hint || '',
                loading: false,
            });
        } catch (e) {
            this.setState({ loading: false, error: 'Error al obtener estado de 2FA.' });
        }
    };

    handleClose = () => {
        this.setState({
            open: false,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            hint: '',
            error: '',
            success: '',
        });
    };

    handleSetPassword = async () => {
        const { newPassword, confirmPassword, hint, currentPassword, hasPassword } = this.state;
        if (newPassword !== confirmPassword) {
            this.setState({ error: 'Las contraseñas no coinciden.' });
            return;
        }
        if (newPassword.length < 1) {
            this.setState({ error: 'La contraseña no puede estar vacía.' });
            return;
        }
        this.setState({ loading: true, error: '' });
        try {
            await TdLibController.send({
                '@type': 'setTwoStepVerificationPassword',
                current_password: hasPassword ? currentPassword : '',
                new_password: newPassword,
                new_hint: hint,
            });
            this.setState({
                loading: false,
                success: 'Contraseña actualizada correctamente.',
                mode: 'view',
                hasPassword: true,
                passwordHint: hint,
            });
        } catch (e) {
            this.setState({ loading: false, error: e.message || 'Error al establecer la contraseña.' });
        }
    };

    handleDisablePassword = async () => {
        const { currentPassword } = this.state;
        this.setState({ loading: true, error: '' });
        try {
            await TdLibController.send({
                '@type': 'setTwoStepVerificationPassword',
                current_password: currentPassword,
                new_password: '',
                new_hint: '',
            });
            this.setState({
                loading: false,
                success: 'Verificación en dos pasos desactivada.',
                mode: 'view',
                hasPassword: false,
            });
        } catch (e) {
            this.setState({ loading: false, error: e.message || 'Error al desactivar la contraseña.' });
        }
    };

    renderView() {
        const { hasPassword, passwordHint, success } = this.state;
        return (
            <>
                <DialogContent>
                    {success && (
                        <Typography color='primary' style={{ marginBottom: 8 }}>
                            {success}
                        </Typography>
                    )}
                    <Typography>
                        {hasPassword
                            ? `La verificación en dos pasos está activada.${
                                  passwordHint ? ` Pista: "${passwordHint}".` : ''
                              }`
                            : 'La verificación en dos pasos está desactivada.'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleClose}>Cerrar</Button>
                    {hasPassword ? (
                        <>
                            <Button color='primary' onClick={() => this.setState({ mode: 'change', error: '' })}>
                                Cambiar contraseña
                            </Button>
                            <Button color='secondary' onClick={() => this.setState({ mode: 'disable', error: '' })}>
                                Desactivar
                            </Button>
                        </>
                    ) : (
                        <Button color='primary' onClick={() => this.setState({ mode: 'set', error: '' })}>
                            Activar
                        </Button>
                    )}
                </DialogActions>
            </>
        );
    }

    renderSetForm(isChange) {
        const { newPassword, confirmPassword, hint, currentPassword, error, loading } = this.state;
        return (
            <>
                <DialogContent>
                    {error && (
                        <Typography color='error' style={{ marginBottom: 8 }}>
                            {error}
                        </Typography>
                    )}
                    {isChange && (
                        <TextField
                            label='Contraseña actual'
                            type='password'
                            fullWidth
                            value={currentPassword}
                            onChange={e => this.setState({ currentPassword: e.target.value })}
                            style={{ marginBottom: 12 }}
                        />
                    )}
                    <TextField
                        label='Nueva contraseña'
                        type='password'
                        fullWidth
                        value={newPassword}
                        onChange={e => this.setState({ newPassword: e.target.value })}
                        style={{ marginBottom: 12 }}
                    />
                    <TextField
                        label='Confirmar contraseña'
                        type='password'
                        fullWidth
                        value={confirmPassword}
                        onChange={e => this.setState({ confirmPassword: e.target.value })}
                        style={{ marginBottom: 12 }}
                    />
                    <TextField
                        label='Pista (opcional)'
                        type='text'
                        fullWidth
                        value={hint}
                        onChange={e => this.setState({ hint: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => this.setState({ mode: 'view', error: '' })}>Cancelar</Button>
                    <Button color='primary' disabled={loading} onClick={this.handleSetPassword}>
                        {loading ? <CircularProgress size={20} /> : 'Guardar'}
                    </Button>
                </DialogActions>
            </>
        );
    }

    renderDisableForm() {
        const { currentPassword, error, loading } = this.state;
        return (
            <>
                <DialogContent>
                    {error && (
                        <Typography color='error' style={{ marginBottom: 8 }}>
                            {error}
                        </Typography>
                    )}
                    <Typography style={{ marginBottom: 12 }}>
                        Ingresa tu contraseña actual para desactivar la verificación en dos pasos.
                    </Typography>
                    <TextField
                        label='Contraseña actual'
                        type='password'
                        fullWidth
                        value={currentPassword}
                        onChange={e => this.setState({ currentPassword: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => this.setState({ mode: 'view', error: '' })}>Cancelar</Button>
                    <Button color='secondary' disabled={loading} onClick={this.handleDisablePassword}>
                        {loading ? <CircularProgress size={20} /> : 'Desactivar'}
                    </Button>
                </DialogActions>
            </>
        );
    }

    render() {
        const { open, loading, hasPassword, mode } = this.state;

        return (
            <Dialog open={open} onClose={this.handleClose} maxWidth='xs' fullWidth>
                <DialogTitle>Verificación en dos pasos</DialogTitle>
                {loading && hasPassword === null ? (
                    <DialogContent style={{ textAlign: 'center', padding: 32 }}>
                        <CircularProgress />
                    </DialogContent>
                ) : mode === 'view' ? (
                    this.renderView()
                ) : mode === 'disable' ? (
                    this.renderDisableForm()
                ) : (
                    this.renderSetForm(mode === 'change')
                )}
            </Dialog>
        );
    }
}

export default TwoStepVerification;
