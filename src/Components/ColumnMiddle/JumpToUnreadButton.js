/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import IconButton from '@material-ui/core/IconButton';
import './JumpToUnreadButton.css';

const styles = theme => ({
    jumpButton: {
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF',
        borderColor: theme.palette.divider,
        color: theme.palette.primary.main
    }
});

class JumpToUnreadButton extends React.Component {
    render() {
        const { classes, onClick, unreadCount } = this.props;

        return (
            <div className={classNames('jump-to-unread-button', classes.jumpButton)} onMouseDown={onClick}>
                <IconButton disableRipple>
                    <ArrowUpwardIcon />
                </IconButton>
                {unreadCount > 0 && (
                    <div className='jump-to-unread-count'>{unreadCount > 99 ? '99+' : unreadCount}</div>
                )}
            </div>
        );
    }
}

JumpToUnreadButton.propTypes = {
    onClick: PropTypes.func.isRequired,
    unreadCount: PropTypes.number
};

JumpToUnreadButton.defaultProps = {
    unreadCount: 0
};

export default withStyles(styles)(JumpToUnreadButton);
