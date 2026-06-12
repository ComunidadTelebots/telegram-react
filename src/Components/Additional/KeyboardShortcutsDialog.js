import React, { Component } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import './KeyboardShortcutsDialog.css';

const SHORTCUTS = [
    { section: 'Navegación' },
    { keys: ['Ctrl', 'Tab'], desc: 'Siguiente chat' },
    { keys: ['Ctrl', 'Shift', 'Tab'], desc: 'Chat anterior' },
    { keys: ['Ctrl', 'F'], desc: 'Buscar' },
    { keys: ['Esc'], desc: 'Cerrar / Cancelar' },
    { section: 'Mensajes' },
    { keys: ['Enter'], desc: 'Enviar mensaje' },
    { keys: ['Shift', 'Enter'], desc: 'Nueva línea' },
    { keys: ['↑'], desc: 'Editar último mensaje propio' },
    { keys: ['Ctrl', 'Z'], desc: 'Deshacer en el compositor' },
    { section: 'Formato de texto' },
    { keys: ['Ctrl', 'B'], desc: 'Negrita' },
    { keys: ['Ctrl', 'I'], desc: 'Cursiva' },
    { keys: ['Ctrl', 'U'], desc: 'Subrayado' },
    { keys: ['Ctrl', 'Shift', 'X'], desc: 'Tachado' },
    { keys: ['Ctrl', 'Shift', 'M'], desc: 'Código monoespaciado' },
    { keys: ['Ctrl', 'K'], desc: 'Insertar enlace' },
    { section: 'General' },
    { keys: ['?'], desc: 'Esta ayuda de atajos' },
    { keys: ['Ctrl', 'Shift', 'D'], desc: 'Cambiar tema oscuro/claro' },
];

class KeyboardShortcutsDialog extends Component {
    constructor(props) {
        super(props);
        this.state = { open: false };
    }

    open = () => this.setState({ open: true });
    close = () => this.setState({ open: false });

    componentDidMount() {
        document.addEventListener('keydown', this.onKey);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKey);
    }

    onKey = e => {
        if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const tag = document.activeElement?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) return;
            this.open();
        }
    };

    render() {
        const { open } = this.state;

        return (
            <Dialog open={open} onClose={this.close} maxWidth='sm' fullWidth>
                <DialogTitle>Atajos de teclado</DialogTitle>
                <DialogContent>
                    <div className='kbd-shortcuts'>
                        {SHORTCUTS.map((item, i) =>
                            item.section ? (
                                <div key={i} className='kbd-section'>
                                    {item.section}
                                </div>
                            ) : (
                                <div key={i} className='kbd-row'>
                                    <span className='kbd-keys'>
                                        {item.keys.map((k, j) => (
                                            <React.Fragment key={j}>
                                                {j > 0 && <span className='kbd-plus'>+</span>}
                                                <kbd className='kbd-key'>{k}</kbd>
                                            </React.Fragment>
                                        ))}
                                    </span>
                                    <span className='kbd-desc'>{item.desc}</span>
                                </div>
                            ),
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        );
    }
}

export default KeyboardShortcutsDialog;
