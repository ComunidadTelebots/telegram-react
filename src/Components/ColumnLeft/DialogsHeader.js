/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import { withTranslation } from 'react-i18next';
import { withRestoreRef, withSaveRef } from '../../Utils/HOC';
import withStyles from '@material-ui/core/styles/withStyles';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
    IconButton,
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import SearchIcon from '@material-ui/icons/Search';
import CloseIcon from '@material-ui/icons/Close';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import Brightness7Icon from '@material-ui/icons/Brightness7';
import ViewHeadlineIcon from '@material-ui/icons/ViewHeadline';
import SpeedDialIcon from '@material-ui/lab/SpeedDialIcon';
import AndroidVersionSelector from './AndroidVersionSelector';
import MainMenuButton from './MainMenuButton';
import { openTutorial } from '../../Actions/Client';
import { isAuthorizationReady } from '../../Utils/Common';
import { ANIMATION_DURATION_100MS } from '../../Constants';
import AppStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import '../ColumnMiddle/Header.css';
import './DialogsHeader.css';

class DialogsHeader extends React.Component {
    constructor(props) {
        super(props);

        this.searchInputRef = React.createRef();

        const compactMode = localStorage.getItem('compactMode') === 'true';
        if (compactMode) {
            document.body.classList.add('compact-dialogs');
        }

        this.state = {
            authorizationState: AppStore.getAuthorizationState(),
            open: false,
            isDark: false,
            compactMode: compactMode,
        };
    }

    setInitQuery(query) {
        const { onSearchTextChange } = this.props;

        const searchInput = this.searchInputRef.current;
        if (searchInput) {
            searchInput.innerText = query;
            if (searchInput.childNodes.length > 0) {
                const range = document.createRange();
                range.setStart(searchInput.childNodes[0], searchInput.childNodes[0].length);
                range.collapse(true);

                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
            searchInput.focus();
            onSearchTextChange(query);
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { openSearch, text } = this.props;

        if (openSearch) {
            const searchInput = this.searchInputRef.current;
            if (openSearch !== prevProps.openSearch) {
                setTimeout(() => {
                    if (searchInput) {
                        searchInput.focus();
                    }
                }, ANIMATION_DURATION_100MS);
            }
        }
    }

    componentDidMount() {
        AppStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
        AppStore.on('clientUpdateThemeChange', this.onThemeChange);
        const palette = this.props.theme && this.props.theme.palette;
        this.setState({ isDark: palette ? palette.type === 'dark' : false });
    }

    componentWillUnmount() {
        AppStore.off('updateAuthorizationState', this.onUpdateAuthorizationState);
        AppStore.off('clientUpdateThemeChange', this.onThemeChange);
    }

    onUpdateAuthorizationState = update => {
        this.setState({ authorizationState: update.authorization_state });
    };

    onThemeChange = () => {
        const palette = this.props.theme && this.props.theme.palette;
        this.setState({ isDark: palette ? palette.type === 'dark' : false });
    };

    handleToggleDark = () => {
        const { isDark } = this.state;
        const newType = isDark ? 'light' : 'dark';
        this.setState({ isDark: !isDark });
        const palette = this.props.theme && this.props.theme.palette;
        AppStore.emit('clientUpdateThemeChanging', {
            type: newType,
            primary: palette ? palette.primary : { main: '#5B8AF1' },
        });
    };

    handleLogOut = () => {
        this.setState({ open: true });
    };

    handleDone = () => {
        this.handleClose();
        TdLibController.logOut();
    };

    handleClose = () => {
        this.setState({ open: false });
    };

    handleToggleCompact = () => {
        const { compactMode } = this.state;
        const next = !compactMode;
        this.setState({ compactMode: next });
        if (next) {
            document.body.classList.add('compact-dialogs');
            localStorage.setItem('compactMode', 'true');
        } else {
            document.body.classList.remove('compact-dialogs');
            localStorage.setItem('compactMode', 'false');
        }
    };

    handleSearch = () => {
        const { onSearch, openSearch } = this.props;
        const { authorizationState } = this.state;
        if (!isAuthorizationReady(authorizationState)) return;

        onSearch(!openSearch);
    };

    handleKeyDown = event => {
        if (event.keyCode === 13) {
            event.preventDefault();
        }
    };

    handleKeyUp = () => {
        const { onSearchTextChange } = this.props;

        const element = this.searchInputRef.current;
        if (!element) return;

        const { innerHTML } = element;
        if (innerHTML === '<br>' || innerHTML === '<div><br></div>') {
            element.innerHTML = null;
        }
        const { innerText } = element;

        onSearchTextChange(innerText);
    };

    handlePaste = event => {
        const plainText = event.clipboardData.getData('text/plain');
        if (plainText) {
            event.preventDefault();
            document.execCommand('insertText', false, plainText);
        }
    };

    handleCloseArchive = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateCloseArchive',
        });
    };

    render() {
        const { onClick, openArchive, openSearch, t } = this.props;
        const { open, isDark, compactMode } = this.state;

        const confirmLogoutDialog = open ? (
            <Dialog transitionDuration={0} open={open} onClose={this.handleClose} aria-labelledby='form-dialog-title'>
                <DialogTitle id='form-dialog-title'>{t('Confirm')}</DialogTitle>
                <DialogContent>
                    <DialogContentText style={{ whiteSpace: 'pre-wrap' }}>{t('AreYouSureLogout')}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleClose} color='primary'>
                        {t('Cancel')}
                    </Button>
                    <Button onClick={this.handleDone} color='primary'>
                        {t('Ok')}
                    </Button>
                </DialogActions>
            </Dialog>
        ) : null;

        let content = null;
        if (openSearch) {
            content = (
                <>
                    <div className='header-search-input grow'>
                        <div
                            id='header-search-inputbox'
                            ref={this.searchInputRef}
                            placeholder={t('Search')}
                            contentEditable
                            suppressContentEditableWarning
                            onKeyDown={this.handleKeyDown}
                            onKeyUp={this.handleKeyUp}
                            onPaste={this.handlePaste}
                        />
                    </div>
                </>
            );
        } else if (openArchive) {
            content = (
                <>
                    <IconButton className='header-left-button' onClick={this.handleCloseArchive}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer' onClick={onClick}>
                        <span className='header-status-content'>{t('ArchivedChats')}</span>
                    </div>
                </>
            );
        } else {
            content = (
                <>
                    <MainMenuButton onLogOut={this.handleLogOut} />
                    <IconButton className='header-left-button' aria-label='Tutorial' onClick={() => openTutorial()}>
                        <HelpOutlineIcon />
                    </IconButton>
                    <IconButton
                        className='header-left-button'
                        aria-label='Cambiar tema'
                        title={isDark ? 'Modo claro' : 'Modo oscuro'}
                        onClick={this.handleToggleDark}>
                        {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                    <IconButton
                        className='header-left-button'
                        aria-label='Modo compacto'
                        title={compactMode ? 'Desactivar modo compacto' : 'Activar modo compacto'}
                        onClick={this.handleToggleCompact}
                        style={{ opacity: compactMode ? 1 : 0.5 }}>
                        <ViewHeadlineIcon />
                    </IconButton>
                    {confirmLogoutDialog}
                    <div className='header-status grow cursor-pointer' onClick={onClick}>
                        <span className='header-status-content'>{t('AppName')}</span>
                    </div>
                    <AndroidVersionSelector />
                </>
            );
        }

        return (
            <div className='header-master'>
                {content}
                <IconButton className='header-right-button' aria-label={t('Search')} onMouseDown={this.handleSearch}>
                    <SpeedDialIcon open={openSearch} icon={<SearchIcon />} openIcon={<CloseIcon />} />
                </IconButton>
            </div>
        );
    }
}

DialogsHeader.propTypes = {
    openSearch: PropTypes.bool.isRequired,
    openArchive: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
    onSearch: PropTypes.func.isRequired,
    onSearchTextChange: PropTypes.func.isRequired,
};

const enhance = compose(withSaveRef(), withTranslation(), withStyles({}, { withTheme: true }), withRestoreRef());

export default enhance(DialogsHeader);
