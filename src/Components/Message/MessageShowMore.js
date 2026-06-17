import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import './MessageShowMore.css';

const SHOW_MORE_THRESHOLD = 1024;

class MessageShowMore extends Component {
    constructor(props) {
        super(props);
        this.state = { expanded: false };
    }

    handleToggle = e => {
        e.stopPropagation();
        this.setState(s => ({ expanded: !s.expanded }));
    };

    render() {
        const { rawText, children, t } = this.props;
        const { expanded } = this.state;

        if (!rawText || rawText.length <= SHOW_MORE_THRESHOLD) {
            return children;
        }

        return (
            <span className='msg-show-more-wrapper'>
                {expanded ? children : <span className='msg-show-more-clamp'>{children}</span>}
                <button type='button' className='msg-show-more-btn' onClick={this.handleToggle}>
                    {expanded ? t('ShowLess', 'Mostrar menos') : t('ShowMore', 'Mostrar más')}
                </button>
            </span>
        );
    }
}

export default withTranslation()(MessageShowMore);
