/*
 * Compact Android version selector for the dialogs header.
 */

import React from 'react';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import CheckIcon from '@material-ui/icons/Check';
import ApplicationStore from '../../Stores/ApplicationStore';
import { DESIGN_ACCENTS, getDesign, setDesign } from '../../Design';
import './AndroidVersionSelector.css';

const ANDROID_VERSIONS = [
    {
        value: 'android',
        label: 'v16',
        detail: 'Beta 12.6.4',
        tag: 'Glass',
    },
    {
        value: 'android-glass',
        label: 'v15',
        detail: '12.6 Feb 9',
        tag: 'Redesign',
    },
    {
        value: 'android-redesign',
        label: 'v14',
        detail: '12.5 pre-redesign',
        tag: 'Drawer',
    },
    {
        value: 'android-classic',
        label: 'v13',
        detail: '7.x Classic',
        tag: 'Classic',
    },
];

function isAndroidDesign(design) {
    return design === 'android' || design.indexOf('android-') === 0;
}

class AndroidVersionSelector extends React.PureComponent {
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

    handleSelect = design => {
        setDesign(design);
        this.setState({ design, open: false });

        ApplicationStore.emit('clientUpdateThemeChanging', {
            type: document.body.classList.contains('theme-dark') ? 'dark' : 'light',
            primary: { main: DESIGN_ACCENTS[design] || DESIGN_ACCENTS.android },
        });
    };

    render() {
        const { open, design } = this.state;
        if (!isAndroidDesign(design)) return null;

        const current = ANDROID_VERSIONS.find(x => x.value === design) || ANDROID_VERSIONS[0];

        return (
            <div className='android-version-selector' ref={this.rootRef}>
                <button
                    type='button'
                    className='android-version-trigger'
                    onClick={this.handleToggle}
                    aria-haspopup='menu'
                    aria-expanded={open}>
                    <span className='android-version-trigger-text'>Android {current.label}</span>
                    <KeyboardArrowDownIcon className='android-version-chevron' />
                </button>
                {open && (
                    <div className='android-version-menu' role='menu'>
                        {ANDROID_VERSIONS.map(option => {
                            const selected = option.value === design;

                            return (
                                <button
                                    key={option.value}
                                    type='button'
                                    className='android-version-option'
                                    onClick={() => this.handleSelect(option.value)}>
                                    <span className='android-version-copy'>
                                        <span className='android-version-detail'>{option.detail}</span>
                                        <span className='android-version-label'>Android {option.label}</span>
                                    </span>
                                    <span className='android-version-tag'>{option.tag}</span>
                                    {selected && <CheckIcon className='android-version-check' />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
}

export default AndroidVersionSelector;
