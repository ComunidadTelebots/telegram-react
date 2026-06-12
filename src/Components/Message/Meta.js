/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { withTranslation } from 'react-i18next';
import { getDate, getDateHint } from '../../Utils/Message';
import './Meta.css';

function formatViews(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
}

class Meta extends React.Component {
    render() {
        const { date, editDate, onDateClick, t, views } = this.props;

        const dateStr = getDate(date);
        const dateHintStr = getDateHint(date);

        return (
            <div className='meta'>
                <span>&ensp;</span>
                {views > 0 && (
                    <>
                        <VisibilityIcon fontSize='inherit' className='meta-views-icon' />
                        <span className='meta-views'>
                            &nbsp;
                            {formatViews(views)}
                            &nbsp; &nbsp;
                        </span>
                    </>
                )}
                {editDate > 0 && <span>{t('EditedMessage')}&nbsp;</span>}
                <a onClick={onDateClick}>
                    <span title={dateHintStr}>{dateStr}</span>
                </a>
            </div>
        );
    }
}

Meta.propTypes = {
    views: PropTypes.number,
    date: PropTypes.number.isRequired,
    editDate: PropTypes.number,
    onDateClick: PropTypes.func,
};

export default withTranslation()(Meta);
