/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import MenuIcon from '@material-ui/icons/Menu';
import PaletteIcon from '@material-ui/icons/Palette';
import LanguageIcon from '@material-ui/icons/Language';
import DevicesIcon from '@material-ui/icons/Devices';
import StorageIcon from '@material-ui/icons/Storage';
import EmojiEmotionsIcon from '@material-ui/icons/EmojiEmotions';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import { compose } from 'recompose';
import ThemePicker from './ThemePicker';
import LanguagePicker from './LanguagePicker';
import ActiveSessions from '../Additional/ActiveSessions';
import KeyboardShortcutsDialog from '../Additional/KeyboardShortcutsDialog';
import AndroidDrawer from './AndroidDrawer';
import AndroidDataSettings from './AndroidDataSettings';
import FavedStickers from '../Additional/FavedStickers';
import { isAuthorizationReady } from '../../Utils/Common';
import ApplicationStore from '../../Stores/ApplicationStore';
import UserStore from '../../Stores/UserStore';
import TdLibController from '../../Controllers/TdLibController';
import { WASM_FILE_HASH, WASM_FILE_NAME } from '../../Constants';
import { getDesign } from '../../Design';
import './MainMenuButton.css';

const styles = {
    menuIconButton: {
        margin: '8px -2px 8px 12px',
    },
};

function hasDrawer(d) {
    return d != null && d.startsWith('android');
}

class MainMenuButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            authorizationState: ApplicationStore.getAuthorizationState(),
            drawerOpen: false,
            menuAnchor: null,
            accounts: TdLibController.getAccounts ? TdLibController.getAccounts() : [],
            activeAccountIndex: parseInt(localStorage.getItem('tg_gramjs_active_account') || '0', 10),
            design: getDesign(),
        };
    }

    componentDidMount() {
        ApplicationStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
        ApplicationStore.on('clientUpdateThemeChange', this.onDesignChange);
        TdLibController.on('clientUpdate', this.onClientUpdate);
    }

    componentWillUnmount() {
        ApplicationStore.off('updateAuthorizationState', this.onUpdateAuthorizationState);
        ApplicationStore.off('clientUpdateThemeChange', this.onDesignChange);
        TdLibController.off('clientUpdate', this.onClientUpdate);
    }

    onUpdateAuthorizationState = update => {
        this.setState({ authorizationState: update.authorization_state });
    };

    onDesignChange = () => {
        this.setState({ design: getDesign() });
    };

    onClientUpdate = update => {
        if (update['@type'] === 'clientUpdateAccounts') {
            this.setState({ accounts: update.accounts, activeAccountIndex: update.activeIndex });
        }
    };

    handleMenuOpen = event => {
        const { authorizationState } = this.state;
        if (!isAuthorizationReady(authorizationState)) return;
        if (hasDrawer(this.state.design)) this.setState({ drawerOpen: true });
        else this.setState({ menuAnchor: event.currentTarget });
    };

    handleDrawerClose = () => {
        this.setState({ drawerOpen: false });
    };

    handleMenuClose = () => this.setState({ menuAnchor: null });

    runMenuAction = action => {
        this.handleMenuClose();
        action();
    };

    handleLogOut = () => {
        this.props.onLogOut && this.props.onLogOut();
    };

    handleActiveSessions = () => {
        this.activeSessionsRef && this.activeSessionsRef.open();
    };

    handleAppearance = () => {
        this.themePicker && this.themePicker.open();
    };

    render() {
        const { classes } = this.props;
        const { authorizationState, drawerOpen, design, menuAnchor } = this.state;

        const showDrawer = isAuthorizationReady(authorizationState) && hasDrawer(design);

        return (
            <>
                <IconButton
                    aria-haspopup='true'
                    className={classes.menuIconButton}
                    aria-label='Menu'
                    onClick={this.handleMenuOpen}>
                    <MenuIcon />
                </IconButton>
                {showDrawer && drawerOpen && <AndroidDrawer onClose={this.handleDrawerClose} />}
                {!showDrawer && (
                    <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={this.handleMenuClose} keepMounted>
                        <MenuItem onClick={() => this.runMenuAction(this.handleAppearance)}>
                            <ListItemIcon>
                                <PaletteIcon />
                            </ListItemIcon>
                            Apariencia
                        </MenuItem>
                        <MenuItem onClick={() => this.runMenuAction(() => this.languagePickerRef.open())}>
                            <ListItemIcon>
                                <LanguageIcon />
                            </ListItemIcon>
                            Idioma
                        </MenuItem>
                        <MenuItem onClick={() => this.runMenuAction(this.handleActiveSessions)}>
                            <ListItemIcon>
                                <DevicesIcon />
                            </ListItemIcon>
                            Dispositivos
                        </MenuItem>
                        <MenuItem onClick={() => this.runMenuAction(() => this.dataSettingsRef.open())}>
                            <ListItemIcon>
                                <StorageIcon />
                            </ListItemIcon>
                            Datos y almacenamiento
                        </MenuItem>
                        <MenuItem onClick={() => this.runMenuAction(() => this.favedStickersRef.open())}>
                            <ListItemIcon>
                                <EmojiEmotionsIcon />
                            </ListItemIcon>
                            Stickers favoritos
                        </MenuItem>
                    </Menu>
                )}
                <ThemePicker innerRef={ref => (this.themePicker = ref)} />
                <LanguagePicker ref={ref => (this.languagePickerRef = ref)} />
                <ActiveSessions ref={ref => (this.activeSessionsRef = ref)} />
                <KeyboardShortcutsDialog ref={ref => (this.kbdShortcutsRef = ref)} />
                <AndroidDataSettings ref={ref => (this.dataSettingsRef = ref)} />
                <FavedStickers ref={ref => (this.favedStickersRef = ref)} />
            </>
        );
    }
}

const enhance = compose(withTranslation(), withStyles(styles, { withTheme: true }));

export default enhance(MainMenuButton);
