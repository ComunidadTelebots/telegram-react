/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';

export default function CollapsibleBlockquote({ children, initialCollapsed }) {
    const [collapsed, setCollapsed] = useState(Boolean(initialCollapsed));

    if (!initialCollapsed) {
        return <blockquote className='message-blockquote'>{children}</blockquote>;
    }

    return (
        <blockquote className={`message-blockquote${collapsed ? ' collapsed' : ''}`}>
            {children}
            <span
                className='message-blockquote-toggle'
                onClick={e => {
                    e.stopPropagation();
                    setCollapsed(c => !c);
                }}>
                {collapsed ? '···' : '▲'}
            </span>
        </blockquote>
    );
}
