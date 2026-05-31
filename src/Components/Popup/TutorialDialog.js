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
import PlayCircleFilledIcon from '@material-ui/icons/PlayCircleFilled';
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

STEPS.splice(STEPS.length - 1, 0, {
    Icon: PlayCircleFilledIcon,
    title: 'Demostracion',
    text:
        'Asi se organiza la app: chats a la izquierda, conversacion en el centro y acciones rapidas para buscar, enviar y cambiar de diseno.',
    demo: true,
});

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
        if (step >= STEPS.length - 1) {
            this.handleClose();
            return;
        }
        this.setState({ step: step + 1 });
    };

    renderStepVisual(step) {
        switch (step) {
            case 0:
                return (
                    <div className='tutorial-mini tutorial-mini--welcome'>
                        <div className='tutorial-mini-logo'>TG</div>
                        <div className='tutorial-mini-stack'>
                            <span />
                            <span />
                            <span />
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className='tutorial-mini tutorial-mini--search'>
                        <div className='tutorial-mini-searchbar'>Buscar chats</div>
                        <div className='tutorial-mini-row tutorial-mini-row--active'>Comunidad</div>
                        <div className='tutorial-mini-row'>Contactos frecuentes</div>
                        <div className='tutorial-mini-row'>Busquedas recientes</div>
                    </div>
                );
            case 2:
                return (
                    <div className='tutorial-mini tutorial-mini--messages'>
                        <div className='tutorial-mini-bubble tutorial-mini-bubble--in'>
                            Hola, tienes stickers y emojis.
                        </div>
                        <div className='tutorial-mini-bubble tutorial-mini-bubble--out'>Listo para enviar.</div>
                        <div className='tutorial-mini-composer'>Emoji · Sticker · Mensaje</div>
                    </div>
                );
            case 3:
                return (
                    <div className='tutorial-mini tutorial-mini--stories'>
                        <div className='tutorial-mini-story tutorial-mini-story--active' />
                        <div className='tutorial-mini-story' />
                        <div className='tutorial-mini-story' />
                        <div className='tutorial-mini-phone'>
                            <span />
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className='tutorial-mini tutorial-mini--designs'>
                        <span>iOS</span>
                        <span>Android</span>
                        <span>Aurora</span>
                        <span>Desktop</span>
                    </div>
                );
            case 5:
                return (
                    <div className='tutorial-mini tutorial-mini--articles'>
                        <div className='tutorial-mini-article'>
                            <b>Articulo destacado</b>
                            <span />
                            <span />
                        </div>
                        <div className='tutorial-mini-pills'>
                            <em>Instant View</em>
                            <em>AMP</em>
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className='tutorial-mini tutorial-mini--shortcuts'>
                        <kbd>Ctrl</kbd>
                        <kbd>K</kbd>
                        <kbd>Esc</kbd>
                        <kbd>Alt</kbd>
                        <kbd>1</kbd>
                    </div>
                );
            default:
                return (
                    <div className='tutorial-mini tutorial-mini--ready'>
                        <CheckCircleIcon />
                        <span>Tutorial siempre disponible desde el menu</span>
                    </div>
                );
        }
    }

    render() {
        const { open, step } = this.state;
        const current = STEPS[step];
        const Icon = current.Icon;
        const isLast = step === STEPS.length - 1;
        const demoStep = STEPS.findIndex(item => item.demo);
        const showDemoButton = demoStep !== -1 && step !== demoStep;
        return (
            <Dialog open={open} onClose={this.handleClose} classes={{ paper: 'tutorial-paper' }}>
                <div className='tutorial-dialog'>
                    <IconButton className='tutorial-close' aria-label='Close' onClick={this.handleClose}>
                        <CloseIcon />
                    </IconButton>
                    <div className='tutorial-icon'>
                        <Icon style={{ fontSize: 56 }} />
                    </div>
                    <div className='tutorial-title'>{current.title}</div>
                    <div className='tutorial-text'>{current.text}</div>
                    {!current.demo && this.renderStepVisual(step)}
                    {current.demo && (
                        <div className='tutorial-demo' aria-label='Vista de demostracion'>
                            <div className='tutorial-demo-sidebar'>
                                <div className='tutorial-demo-search' />
                                <div className='tutorial-demo-chat tutorial-demo-chat--active'>
                                    <span />
                                    <div>
                                        <b>Comunidad</b>
                                        <em>Nuevo mensaje</em>
                                    </div>
                                </div>
                                <div className='tutorial-demo-chat'>
                                    <span />
                                    <div>
                                        <b>Soporte</b>
                                        <em>En linea</em>
                                    </div>
                                </div>
                                <div className='tutorial-demo-chat'>
                                    <span />
                                    <div>
                                        <b>Ideas</b>
                                        <em>3 sin leer</em>
                                    </div>
                                </div>
                            </div>
                            <div className='tutorial-demo-main'>
                                <div className='tutorial-demo-topbar'>Comunidad</div>
                                <div className='tutorial-demo-messages'>
                                    <span className='tutorial-demo-bubble tutorial-demo-bubble--in'>
                                        Hola, aqui ves una demo rapida.
                                    </span>
                                    <span className='tutorial-demo-bubble tutorial-demo-bubble--out'>
                                        Perfecto, ya se como usarlo.
                                    </span>
                                </div>
                                <div className='tutorial-demo-composer'>Mensaje</div>
                            </div>
                        </div>
                    )}
                    <div className='tutorial-dots'>
                        {STEPS.map((s, i) => (
                            <span
                                key={i}
                                className={i === step ? 'tutorial-dot tutorial-dot--active' : 'tutorial-dot'}
                                onClick={() => this.setState({ step: i })}
                            />
                        ))}
                    </div>
                    <div className='tutorial-actions'>
                        <div className='tutorial-actions-left'>
                            <Button className='tutorial-skip' onClick={this.handleClose}>
                                Saltar
                            </Button>
                            {showDemoButton && (
                                <Button
                                    className='tutorial-demo-button'
                                    onClick={() => this.setState({ step: demoStep })}>
                                    Ver demo
                                </Button>
                            )}
                        </div>
                        <div className='tutorial-nav'>
                            {step > 0 && (
                                <IconButton className='tutorial-prev' aria-label='Back' onClick={this.handleBack}>
                                    <ChevronLeftIcon />
                                </IconButton>
                            )}
                            <Button className='tutorial-next' variant='contained' onClick={this.handleNext}>
                                {isLast ? 'Empezar' : 'Siguiente'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Dialog>
        );
    }
}

export default TutorialDialog;
