/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import AttachFileIcon from '../../Assets/Icons/Attach';
import IconButton from '@material-ui/core/IconButton';
import InsertDriveFileIcon from '../../Assets/Icons/Document';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import PhotoIcon from '../../Assets/Icons/SharedMedia';
import LocationIcon from '@material-ui/icons/LocationOnOutlined';
import PollIcon from '@material-ui/icons/PollOutlined';
import SmartToyIcon from '@material-ui/icons/SmartphoneOutlined';
import { canSendDocuments, canSendPhotos, canSendPolls, isPrivateChat } from '../../Utils/Chat';
import { ANIMATION_DURATION_300MS } from '../../Constants';
import TdLibController from '../../Controllers/TdLibController';

class AttachButton extends React.Component {
    state = {
        anchorEl: null,
        attachBots: [],
    };

    componentDidMount() {
        TdLibController.send({ '@type': 'getAttachMenuBots' })
            .then(r => this.setState({ attachBots: r.bots || [] }))
            .catch(() => {});
    }

    handleMenuClick = event => {
        this.setState({ anchorEl: event.currentTarget });
    };

    handleMenuClose = () => {
        this.setState({ anchorEl: null });
    };

    handleAttachPhoto = () => {
        this.handleMenuClose();

        const { onAttachPhoto } = this.props;
        if (!onAttachPhoto) return;

        setTimeout(() => onAttachPhoto(), ANIMATION_DURATION_300MS);
    };

    handleAttachDocument = () => {
        this.handleMenuClose();

        const { onAttachDocument } = this.props;
        if (!onAttachDocument) return;

        setTimeout(() => onAttachDocument(), ANIMATION_DURATION_300MS);
    };

    handleAttachPoll = () => {
        this.handleMenuClose();

        const { onAttachPoll } = this.props;
        if (!onAttachPoll) return;

        onAttachPoll();
    };

    handleAttachLocation = () => {
        this.handleMenuClose();

        const { onAttachLocation } = this.props;
        if (!onAttachLocation) return;

        onAttachLocation();
    };

    handleAttachBot = async bot => {
        this.handleMenuClose();
        try {
            const r = await TdLibController.send({
                '@type': 'requestSimpleWebView',
                bot_id: bot.bot_id,
                url: undefined,
            });
            if (r && r.url) window.open(r.url, '_blank', 'noopener');
        } catch (e) {}
    };

    render() {
        const { classes, t, chatId } = this.props;
        const { anchorEl, attachBots } = this.state;

        return (
            <>
                <IconButton
                    className='inputbox-icon-button'
                    aria-label='Attach'
                    open={Boolean(anchorEl)}
                    onClick={this.handleMenuClick}>
                    <AttachFileIcon />
                </IconButton>
                <Menu
                    id='attach-menu'
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    getContentAnchorEl={null}
                    disableAutoFocusItem
                    disableRestoreFocus={true}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    onClose={this.handleMenuClose}>
                    <MenuItem onClick={this.handleAttachPhoto} disabled={!canSendPhotos(chatId)}>
                        <ListItemIcon>
                            <PhotoIcon />
                        </ListItemIcon>
                        <ListItemText primary={t('AttachPhoto')} />
                    </MenuItem>
                    <MenuItem onClick={this.handleAttachDocument} disabled={!canSendDocuments(chatId)}>
                        <ListItemIcon>
                            <InsertDriveFileIcon />
                        </ListItemIcon>
                        <ListItemText primary={t('AttachDocument')} />
                    </MenuItem>
                    {!isPrivateChat(chatId) && (
                        <MenuItem onClick={this.handleAttachPoll} disabled={!canSendPolls(chatId)}>
                            <ListItemIcon>
                                <PollIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('Poll')} />
                        </MenuItem>
                    )}
                    <MenuItem onClick={this.handleAttachLocation}>
                        <ListItemIcon>
                            <LocationIcon />
                        </ListItemIcon>
                        <ListItemText primary='Ubicación en vivo' />
                    </MenuItem>
                    {attachBots.map(bot => (
                        <MenuItem key={bot.bot_id} onClick={() => this.handleAttachBot(bot)}>
                            <ListItemIcon>
                                <SmartToyIcon />
                            </ListItemIcon>
                            <ListItemText primary={bot.short_name} />
                        </MenuItem>
                    ))}
                </Menu>
            </>
        );
    }
}

AttachButton.propTypes = {
    chatId: PropTypes.number.isRequired,
    onAttachDocument: PropTypes.func.isRequired,
    onAttachPhoto: PropTypes.func.isRequired,
    onAttachPoll: PropTypes.func.isRequired,
    onAttachLocation: PropTypes.func,
};

export default withTranslation()(AttachButton);
