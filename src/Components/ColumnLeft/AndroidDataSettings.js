import React from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import DeleteSweepIcon from '@material-ui/icons/DeleteSweep';
import NotificationsIcon from '@material-ui/icons/Notifications';
import SaveIcon from '@material-ui/icons/Save';
import StorageIcon from '@material-ui/icons/Storage';
import Snackbar from '@material-ui/core/Snackbar';

const formatBytes = value => {
    if (!Number.isFinite(value) || value <= 0) return '0 MB';
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
};

class AndroidDataSettings extends React.PureComponent {
    state = {
        open: false,
        usage: 0,
        quota: 0,
        persistent: false,
        notificationPermission: 'default',
        snackbar: null,
    };

    open = () => {
        this.setState({ open: true }, this.refreshStatus);
    };

    close = () => this.setState({ open: false });

    refreshStatus = async () => {
        let usage = 0;
        let quota = 0;
        let persistent = false;
        try {
            if (navigator.storage && navigator.storage.estimate) {
                ({ usage = 0, quota = 0 } = await navigator.storage.estimate());
            }
            if (navigator.storage && navigator.storage.persisted) {
                persistent = await navigator.storage.persisted();
            }
        } catch {}
        this.setState({
            usage,
            quota,
            persistent,
            notificationPermission: 'Notification' in window ? Notification.permission : 'unsupported',
        });
    };

    requestPersistentStorage = async () => {
        if (!navigator.storage || !navigator.storage.persist) {
            this.setState({ snackbar: 'El navegador no permite solicitar almacenamiento persistente.' });
            return;
        }
        const persistent = await navigator.storage.persist();
        this.setState({
            persistent,
            snackbar: persistent
                ? 'Almacenamiento persistente activado.'
                : 'El navegador no concedió almacenamiento persistente.',
        });
    };

    requestNotifications = async () => {
        if (!('Notification' in window)) {
            this.setState({ snackbar: 'Este navegador no admite notificaciones.' });
            return;
        }
        const notificationPermission = await Notification.requestPermission();
        this.setState({ notificationPermission, snackbar: `Permiso: ${notificationPermission}` });
    };

    clearWebCache = async () => {
        if (!('caches' in window)) {
            this.setState({ snackbar: 'La caché web no está disponible.' });
            return;
        }
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
        await this.refreshStatus();
        this.setState({ snackbar: `${names.length} cachés temporales eliminadas. Tus chats no se han borrado.` });
    };

    renderRow(icon, label, value, action) {
        return (
            <button className='android-settings-row' onClick={action}>
                <span className='android-settings-row-icon'>{icon}</span>
                <span className='android-settings-row-content'>
                    <span className='android-settings-row-label'>{label}</span>
                    <span className='android-settings-row-value'>{value}</span>
                </span>
            </button>
        );
    }

    render() {
        const { open, usage, quota, persistent, notificationPermission, snackbar } = this.state;
        if (!open) return null;
        return (
            <div className='android-settings-overlay'>
                <div className='android-settings-toolbar'>
                    <button className='android-settings-back' onClick={this.close} aria-label='Volver'>
                        <ArrowBackIcon />
                    </button>
                    <span className='android-settings-toolbar-title'>Datos y almacenamiento</span>
                </div>
                <div className='android-settings-content'>
                    <div className='android-settings-section'>
                        {this.renderRow(
                            <StorageIcon />,
                            'Uso de almacenamiento',
                            `${formatBytes(usage)} de ${formatBytes(quota)}`,
                            this.refreshStatus,
                        )}
                        <div className='android-settings-divider' />
                        {this.renderRow(
                            <SaveIcon />,
                            'Conservar datos sin conexión',
                            persistent ? 'Activado' : 'Solicitar permiso',
                            this.requestPersistentStorage,
                        )}
                        <div className='android-settings-divider' />
                        {this.renderRow(
                            <NotificationsIcon />,
                            'Notificaciones del navegador',
                            notificationPermission,
                            this.requestNotifications,
                        )}
                    </div>
                    <div className='android-settings-section android-settings-section--danger'>
                        {this.renderRow(
                            <DeleteSweepIcon />,
                            'Vaciar caché temporal',
                            'No elimina chats ni sesiones',
                            this.clearWebCache,
                        )}
                    </div>
                </div>
                <Snackbar
                    open={!!snackbar}
                    message={snackbar || ''}
                    autoHideDuration={3500}
                    onClose={() => this.setState({ snackbar: null })}
                />
            </div>
        );
    }
}

export default AndroidDataSettings;
