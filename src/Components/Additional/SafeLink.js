/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import { openChat } from '../../Actions/Client';
import TdLibController from '../../Controllers/TdLibController';
import { getDecodedUrl, getHref, isUrlSafe, parseTelegramInternalLink } from '../../Utils/Url';
import { openInternalBrowser } from '../../Actions/InternalBrowser';
import './SafeLink.css';

class SafeLink extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};
    }

    static getDerivedStateFromProps(props, state) {
        const { displayText, mail, url } = props;

        if (state.prevUrl !== url || state.prevDisplayText !== displayText) {
            return {
                prevUrl: url,
                prevDisplayText: displayText,
                safe: isUrlSafe(displayText, url),
                decodedUrl: getDecodedUrl(url, mail),
                href: getHref(url, mail),
                telegramLink: !mail ? parseTelegramInternalLink(url) : null,
                confirm: false,
            };
        }

        return null;
    }

    handleClick = event => {
        event.preventDefault();
        event.stopPropagation();

        this.setState({ confirm: true });
    };

    handleDialogClick = event => {
        event.preventDefault();
        event.stopPropagation();
    };

    handleClose = () => {
        this.setState({ confirm: false });
    };

    handleDone = event => {
        this.handleClose();

        const { url, onClick, onOpen, mail } = this.props;
        if (!url) return;

        if (onOpen) onOpen();

        if (onClick) {
            onClick(event);
        } else if (mail) {
            window.location.href = getHref(url, true);
        } else {
            openInternalBrowser(getHref(url, false));
        }
    };

    handleSafeClick = event => {
        event.stopPropagation();

        const { onClick, onOpen } = this.props;
        const { telegramLink } = this.state;

        if (onOpen) onOpen();

        if (onClick) {
            event.preventDefault();
            onClick(event);
        } else if (telegramLink) {
            event.preventDefault();
            this.openTelegramLink();
        } else if (!this.props.mail) {
            event.preventDefault();
            openInternalBrowser(this.state.href);
        }
    };

    openTelegramLink = async () => {
        const { url } = this.props;
        const { telegramLink } = this.state;
        if (!telegramLink) return;

        try {
            const chat = await TdLibController.send({ '@type': 'openTelegramLink', url });
            if (chat && chat.id) {
                openChat(chat.id, telegramLink.messageId || null);
            }
        } catch (error) {
            const newWindow = window.open('', '_blank', 'noopener,noreferrer');
            if (!newWindow) return;
            newWindow.opener = null;
            newWindow.location = getHref(url);
        }
    };

    render() {
        const { className, children, t, url } = this.props;
        const { confirm, decodedUrl, href, safe } = this.state;

        if (!url) return null;
        if (!decodedUrl) return null;

        return (
            <>
                {safe ? (
                    <a
                        className={className}
                        href={href}
                        title={decodedUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        onClick={this.handleSafeClick}>
                        {children || url}
                    </a>
                ) : (
                    <>
                        <a className={className} title={decodedUrl} onClick={this.handleClick}>
                            {children || url}
                        </a>
                        {confirm && (
                            <Dialog
                                transitionDuration={0}
                                open={confirm}
                                onClose={this.handleClose}
                                onClick={this.handleDialogClick}
                                aria-labelledby='confirm-dialog-title'>
                                <DialogTitle id='confirm-dialog-title'>{t('Confirm')}</DialogTitle>
                                <DialogContent classes={{ root: 'safe-link-content-root' }}>
                                    <DialogContentText>{`Open this link?\n\n${decodedUrl}`}</DialogContentText>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={this.handleClose}>{t('Cancel')}</Button>
                                    <Button onClick={this.handleDone} color='primary'>
                                        {t('Open')}
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        )}
                    </>
                )}
            </>
        );
    }
}

SafeLink.propTypes = {
    url: PropTypes.string.isRequired,
    displayText: PropTypes.string,
    mail: PropTypes.bool,
    onClick: PropTypes.func,
    onOpen: PropTypes.func,
};

export default withTranslation()(SafeLink);
