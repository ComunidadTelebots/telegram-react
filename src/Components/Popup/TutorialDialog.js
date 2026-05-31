/*
 *  Tutorial visual (carrusel) — ComunidadTelebots
 */
import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ForumIcon from '@material-ui/icons/Forum';
import SearchIcon from '@material-ui/icons/Search';
import InsertEmoticonIcon from '@material-ui/icons/InsertEmoticon';
import CameraAltIcon from '@material-ui/icons/CameraAlt';
import PaletteIcon from '@material-ui/icons/Palette';
import FlashOnIcon from '@material-ui/icons/FlashOn';
import KeyboardIcon from '@material-ui/icons/Keyboard';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ApplicationStore from '../../Stores/ApplicationStore';
import { isAuthorizationReady } from '../../Utils/Common';
import './TutorialDialog.css';

const TUTORIAL_FLAG = 'tutorial_seen_v1';

const STEPS = [
    {
        Icon: ForumIcon,
        title: '¡Bienvenido!',
        text:
            'Este es tu cliente de Telegram de la comunidad. Te enseñamos lo esencial en unos pasos. Puedes saltarlo cuando quieras.',
    },
    {
        Icon: SearchIcon,
        title: 'Chats y búsqueda',
        text:
            'Pulsa la lupa o Ctrl/Cmd + K para buscar. Al abrirla verás tus contactos frecuentes y tus búsquedas recientes.',
    },
    {
        Icon: InsertEmoticonIcon,
        title: 'Enviar mensajes',
        text:
            'Escribe abajo y pulsa Enter. Tienes emojis, stickers y emojis personalizados animados en los botones del compositor.',
    },
    {
        Icon: CameraAltIcon,
        title: 'Historias',
        text:
            'Las historias de tus contactos aparecen sobre la lista de chats. Tócalas para verlas a pantalla completa.',
    },
    {
        Icon: PaletteIcon,
        title: 'Diseños',
        text:
            'Lo más especial: cambia entre 8 diseños (iOS, macOS, Android, Aurora, Desktop y más) desde Apariencia. Cada uno tiene su propio estilo.',
    },
    {
        Icon: FlashOnIcon,
        title: 'Artículos rápidos',
        text:
            'En los enlaces a noticias verás botones de Instant View y AMP para leer el artículo al instante, sin salir de la app.',
    },
    {
        Icon: KeyboardIcon,
        title: 'Atajos de teclado',
        text:
            'Esc cierra la búsqueda o el chat abierto. Ctrl/Cmd + K abre la búsqueda. Alt+Ctrl+1…5 abren tus chats fijados.',
    },
    {
        Icon: CheckCircleIcon,
        title: '¡Listo!',
        text: 'Ya puedes empezar. Si quieres volver a ver este tutorial, lo tienes en el menú.',
    },
];

class TutorialDialog extends React.Component {
    state = { open: false, step: 0 };

    componentDidMount() {
        ApplicationStore.on('updateAuthorizationState', this.onAuth);
        ApplicationStore.on('clientUpdateOpenTutorial', this.onOpenRequest);
        this.maybeAutoShow();
    }

    componentWillUnmount() {
        ApplicationStore.off('updateAuthorizationState', this.onAuth);
        ApplicationStore.off('clientUpdateOpenTutorial', this.onOpenRequest);
    }

    onAuth = () => this.maybeAutoShow();

    maybeAutoShow = () => {
        if (this.state.open) return;
        if (localStorage.getItem(TUTORIAL_FLAG)) return;
        if (!isAuthorizationReady(ApplicationStore.getAuthorizationState())) return;
        localStorage.setItem(TUTORIAL_FLAG, '1');
        this.setState({ open: true, step: 0 });
    };

    onOpenRequest = () => this.setState({ open: true, step: 0 });

    handleClose = () => this.setState({ open: false });

    handleBack = () => this.setState(s => ({ step: Math.max(0, s.step - 1) }));

    handleNext = () => {
        const { step } = this.state;
        if (step < STEPS.length - 1) {
            this.setState({ step: step + 1 });
        } else {
            this.handleClose();
        }
    };

    render() {
        const { open, step } = this.state;
        const { Icon, title, text } = STEPS[step];
        const isLast = step === STEPS.length - 1;

        return (
            <Dialog
                open={open}
                onClose={this.handleClose}
                classes={{ paper: 'tutorial-dialog-paper' }}
                maxWidth='xs'
                fullWidth>
                <div className='tutorial-dialog'>
                    <div className='tutorial-dialog-header'>
                        {step > 0 ? (
                            <IconButton size='small' onClick={this.handleBack} className='tutorial-back-btn'>
                                <ChevronLeftIcon />
                            </IconButton>
                        ) : (
                            <div className='tutorial-back-placeholder' />
                        )}
                        <IconButton size='small' onClick={this.handleClose} className='tutorial-close-btn'>
                            <CloseIcon />
                        </IconButton>
                    </div>

                    <div className='tutorial-dialog-body'>
                        <div className='tutorial-icon-wrap'>
                            <Icon className='tutorial-icon' />
                        </div>
                        <h2 className='tutorial-title'>{title}</h2>
                        <p className='tutorial-text'>{text}</p>
                    </div>

                    <div className='tutorial-dialog-footer'>
                        <div className='tutorial-dots'>
                            {STEPS.map((_, i) => (
                                <span key={i} className={`tutorial-dot${i === step ? ' tutorial-dot--active' : ''}`} />
                            ))}
                        </div>
                        <Button
                            variant='contained'
                            color='primary'
                            className='tutorial-next-btn'
                            onClick={this.handleNext}>
                            {isLast ? 'Empezar' : 'Siguiente'}
                        </Button>
                    </div>
                </div>
            </Dialog>
        );
    }
}

export default TutorialDialog;
