/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import './Dice.css';

const DICE_EMOJI_MAP = {
    '🎲': ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'],
    '🎯': null,
    '🏀': null,
    '⚽': null,
    '🎰': null,
    '🎳': null
};

class Dice extends React.Component {
    render() {
        const { dice } = this.props;
        if (!dice) return null;

        const { emoji, value } = dice;
        const faces = DICE_EMOJI_MAP[emoji];
        const displayValue = faces && value >= 1 && value <= faces.length ? faces[value - 1] : null;

        return (
            <div className='dice'>
                <div className='dice-emoji' title={`${emoji} → ${value}`}>
                    {displayValue || emoji}
                </div>
                {value > 0 && <div className='dice-value'>{value}</div>}
            </div>
        );
    }
}

Dice.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    dice: PropTypes.object.isRequired
};

export default Dice;
