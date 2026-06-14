/*
 * Generic design version selector — shows a pill in the dialogs header
 * for any theme family that has multiple sub-variants defined.
 * Replaces the Android-specific AndroidVersionSelector.
 */

import React from 'react';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import CheckIcon from '@material-ui/icons/Check';
import ApplicationStore from '../../Stores/ApplicationStore';
import { DESIGN_ACCENTS, getDesign, getDesignFamily, setDesign } from '../../Design';
import './DesignVersionSelector.css';

// All sub-variants per design family.
// Each entry: { value, label, detail, tag, trigger }
//   value   → design name passed to setDesign()
//   label   → short version label (shown in dropdown secondary row)
//   detail  → longer description (shown in dropdown primary row)
//   tag     → colored badge text
//   trigger → text shown on the pill button
const DESIGN_VERSION_REGISTRY = {
    current: [
        { value: 'current', label: 'Standard', detail: 'Web React standard', tag: 'Standard', trigger: 'Standard' },
        { value: 'current-compact', label: 'Compact', detail: 'Web React compact', tag: 'Compact', trigger: 'Compact' },
    ],
    webk: [
        { value: 'webk', label: 'Standard', detail: 'Web K standard', tag: 'Standard', trigger: 'Standard' },
        { value: 'webk-2025', label: '2025', detail: 'Web K 2025 layout', tag: '2025', trigger: '2025' },
    ],
    weba: [
        { value: 'weba', label: 'Standard', detail: 'Web A (header blanco)', tag: 'Standard', trigger: 'Standard' },
        {
            value: 'weba-classic',
            label: 'Color',
            detail: 'Web A header azul',
            tag: 'Color',
            trigger: 'Color',
        },
    ],
    android: [
        { value: 'android', label: '12.6.4', detail: 'Beta 12.6.4', tag: 'Glass', trigger: 'Beta 12.6.4' },
        { value: 'android-glass', label: '12.6', detail: '12.6 Feb 9', tag: 'Redesign', trigger: '12.6' },
        { value: 'android-redesign', label: '12.5', detail: '12.5 pre-redesign', tag: 'Drawer', trigger: '12.5' },
        { value: 'android-classic', label: '7.x', detail: '7.x Classic', tag: 'Classic', trigger: 'Classic' },
        { value: 'android-v11', label: '8.x', detail: '8.x (2021)', tag: 'v11', trigger: 'v11' },
        { value: 'android-v9', label: '6.x', detail: '6.x Folders', tag: 'v9', trigger: 'v9' },
        { value: 'android-holo', label: '4.x', detail: '4.x Holo', tag: 'Holo', trigger: 'Holo' },
    ],
    ios: [
        { value: 'ios', label: 'iPhone', detail: 'iPhone layout', tag: 'Phone', trigger: 'iPhone' },
        { value: 'ios-ipad', label: 'iPad', detail: 'iPad wide layout', tag: 'iPad', trigger: 'iPad' },
    ],
    macos: [
        { value: 'macos', label: 'Sonoma', detail: 'macOS Sonoma', tag: 'Sonoma', trigger: 'Sonoma' },
        { value: 'macos-monterey', label: 'Monterey', detail: 'macOS Monterey', tag: 'Monterey', trigger: 'Monterey' },
    ],
    tdesktop: [
        { value: 'tdesktop', label: 'Modern', detail: 'TDesktop modern', tag: 'Modern', trigger: 'Modern' },
        { value: 'tdesktop-classic', label: 'Classic', detail: 'TDesktop classic', tag: 'Classic', trigger: 'Classic' },
    ],
    unigram: [
        { value: 'unigram', label: 'WinUI 3', detail: 'Unigram WinUI 3', tag: 'WinUI3', trigger: 'WinUI3' },
        { value: 'unigram-fluent', label: 'Fluent', detail: 'Unigram Fluent Design', tag: 'Fluent', trigger: 'Fluent' },
    ],
    webogram: [
        { value: 'webogram', label: 'Legacy', detail: 'Webogram legacy', tag: 'Legacy', trigger: 'Legacy' },
        { value: 'webogram-blue', label: 'Blue', detail: 'Webogram blue accent', tag: 'Blue', trigger: 'Blue' },
    ],
    aurora: [
        { value: 'aurora', label: 'Default', detail: 'Aurora default', tag: 'Default', trigger: 'Default' },
        {
            value: 'aurora-midnight',
            label: 'Midnight',
            detail: 'Aurora midnight',
            tag: 'Midnight',
            trigger: 'Midnight',
        },
    ],
    telegramx: [
        { value: 'telegramx', label: 'v8', detail: 'TGX v8 (current)', tag: 'v8', trigger: 'v8' },
        { value: 'telegramx-red', label: 'Red', detail: 'TGX Red gradient', tag: 'Red', trigger: 'Red' },
    ],
};

class DesignVersionSelector extends React.PureComponent {
    constructor(props) {
        super(props);

        this.rootRef = React.createRef();
        this.state = {
            open: false,
            design: getDesign(),
        };
    }

    componentDidMount() {
        document.addEventListener('mousedown', this.handleDocumentMouseDown);
        ApplicationStore.on('clientUpdateThemeChange', this.handleThemeChange);
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleDocumentMouseDown);
        ApplicationStore.off('clientUpdateThemeChange', this.handleThemeChange);
    }

    handleThemeChange = () => {
        this.setState({ design: getDesign() });
    };

    handleDocumentMouseDown = event => {
        if (!this.rootRef.current) return;
        if (this.rootRef.current.contains(event.target)) return;
        this.setState({ open: false });
    };

    handleToggle = event => {
        event.stopPropagation();
        this.setState(({ open }) => ({ open: !open }));
    };

    handleSelect = value => {
        setDesign(value);
        this.setState({ design: value, open: false });

        const family = getDesignFamily(value);
        ApplicationStore.emit('clientUpdateThemeChanging', {
            type: document.body.classList.contains('theme-dark') ? 'dark' : 'light',
            primary: { main: DESIGN_ACCENTS[value] || DESIGN_ACCENTS[family] || DESIGN_ACCENTS.current },
        });
    };

    render() {
        const { open, design } = this.state;
        const family = getDesignFamily(design);
        const versions = DESIGN_VERSION_REGISTRY[family];

        // Don't render if there's only one version for this family
        if (!versions || versions.length < 2) return null;

        const current = versions.find(v => v.value === design) || versions[0];
        const accent = DESIGN_ACCENTS[design] || DESIGN_ACCENTS[family] || DESIGN_ACCENTS.current;

        return (
            <div className={`dv-selector dv-selector--${family}`} ref={this.rootRef}>
                <button
                    type='button'
                    className='dv-trigger'
                    style={{ '--dv-accent': accent }}
                    onClick={this.handleToggle}
                    aria-haspopup='menu'
                    aria-expanded={open}>
                    <span className='dv-trigger-text'>{current.trigger || current.detail}</span>
                    <KeyboardArrowDownIcon className='dv-chevron' />
                </button>
                {open && (
                    <div className='dv-menu' role='menu'>
                        {versions.map(option => {
                            const selected = option.value === design;
                            return (
                                <button
                                    key={option.value}
                                    type='button'
                                    className={`dv-option${selected ? ' dv-option--selected' : ''}`}
                                    style={{ '--dv-accent': accent }}
                                    onClick={() => this.handleSelect(option.value)}>
                                    <span className='dv-copy'>
                                        <span className='dv-detail'>{option.detail}</span>
                                        <span className='dv-label'>{option.label}</span>
                                    </span>
                                    <span className='dv-tag'>{option.tag}</span>
                                    {selected && <CheckIcon className='dv-check' />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
}

export default DesignVersionSelector;
