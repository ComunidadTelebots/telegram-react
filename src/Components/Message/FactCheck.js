import React from 'react';
import { getText } from '../../Utils/Message';
import './FactCheck.css';

export default function FactCheck({ factCheck }) {
    if (!factCheck || !factCheck.text) return null;

    const label = factCheck.country ? `Fact Check · ${factCheck.country}` : 'Fact Check';
    const content = getText({ text: factCheck.text, entities: factCheck.entities || [] });

    return (
        <div className='fact-check'>
            <span className='fact-check-label'>{label}</span>
            <span className='fact-check-text'>{content}</span>
        </div>
    );
}
