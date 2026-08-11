/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { readPlusPreferences } from '../../Utils/PlusPreferences';
import './BotCommandSuggestions.css';

class BotCommandSuggestions extends React.PureComponent {
    render() {
        const { commands, query, onSelect } = this.props;
        if (readPlusPreferences().hideBotCommandButton) return null;
        if (!commands || commands.length === 0) return null;

        const filtered = query
            ? commands.filter(c => c.command.toLowerCase().startsWith(query.toLowerCase()))
            : commands;

        if (filtered.length === 0) return null;

        return (
            <div className='bot-cmd-suggestions'>
                {filtered.map(cmd => (
                    <div
                        key={cmd.command}
                        className='bot-cmd-item'
                        onMouseDown={e => {
                            e.preventDefault();
                            onSelect && onSelect(cmd);
                        }}>
                        <span className='bot-cmd-name'>/{cmd.command}</span>
                        {cmd.description && <span className='bot-cmd-desc'>{cmd.description}</span>}
                    </div>
                ))}
            </div>
        );
    }
}

BotCommandSuggestions.propTypes = {
    commands: PropTypes.array,
    query: PropTypes.string,
    onSelect: PropTypes.func,
};

export default BotCommandSuggestions;
