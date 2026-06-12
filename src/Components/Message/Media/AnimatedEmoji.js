/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import './AnimatedEmoji.css';

class AnimatedEmoji extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = { popped: false };
    }

    handleClick = () => {
        this.setState({ popped: true });
        setTimeout(() => this.setState({ popped: false }), 600);
    };

    render() {
        const { emoji } = this.props;
        const { popped } = this.state;

        return (
            <span
                className={`animated-emoji ${popped ? 'animated-emoji-pop' : ''}`}
                onClick={this.handleClick}
                title={emoji}>
                {emoji}
            </span>
        );
    }
}

AnimatedEmoji.propTypes = {
    emoji: PropTypes.string.isRequired,
};

export default AnimatedEmoji;
