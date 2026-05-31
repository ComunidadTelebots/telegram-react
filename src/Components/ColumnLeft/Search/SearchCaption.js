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
import './SearchCaption.css';

const styles = () => ({
    searchCaption: {},
    searchCaptionCommand: {},
});

function SearchCaption(props) {
    const { caption, command, onClick, classes } = props;

    return (
        <div className={classNames('search-caption', classes.searchCaption)}>
            <div className='search-caption-title'>{caption}</div>
            {Boolean(command) && (
                <a className={classNames('search-caption-command', classes.searchCaptionCommand)} onClick={onClick}>
                    {command}
                </a>
            )}
        </div>
    );
}

SearchCaption.propTypes = {
    caption: PropTypes.string.isRequired,
    command: PropTypes.string,
    onClick: PropTypes.func,
};

export default withStyles(styles, { withTheme: true })(SearchCaption);
