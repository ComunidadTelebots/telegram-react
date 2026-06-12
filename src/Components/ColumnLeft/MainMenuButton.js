/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import { compose } from 'recompose';
import ThemePicker from './ThemePicker';
import LanguagePicker from './LanguagePicker';
import ActiveSessions from '../Additional/ActiveSessions';
import KeyboardShortcutsDialog from '../Additional/KeyboardShortcutsDialog';
import AndroidDrawer from './AndroidDrawer';
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

const DRAWER_DESIGNS = new Set(['android-holo', 'android-v9', 'android-v11', 'android-classic', 'android-redesign']);

function hasDrawer(d) {
    return DRAWER_DESIGNS.has(d);
}

class MainMenuButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            authorizationState: ApplicationStore.getAuthorizationState(),
            drawerOpen: false,
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

    handleMenuOpen = () => {
        const { authorizationState } = this.state;
        if (!isAuthorizationReady(authorizationState)) return;
        this.setState({ drawerOpen: true });
    };

    handleDrawerClose = () => {
        this.setState({ drawerOpen: false });
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
        const { authorizationState, drawerOpen, design } = this.state;

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
                <ThemePicker innerRef={ref => (this.themePicker = ref)} />
                <LanguagePicker ref={ref => (this.languagePicker = ref)} />
                <ActiveSessions ref={ref => (this.activeSessionsRef = ref)} />
                <KeyboardShortcutsDialog ref={ref => (this.kbdShortcutsRef = ref)} />
            </>
        );
    }
}

const enhance = compose(withTranslation(), withStyles(styles, { withTheme: true }));

export default enhance(MainMenuButton);
