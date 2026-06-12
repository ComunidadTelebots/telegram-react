/*
 * Panel que muestra los resultados inline de un bot (@bot query).
 */

import React from 'react';
import PropTypes from 'prop-types';
import './InlineBotResults.css';

const MEDIA_TYPES = new Set(['photo', 'gif', 'sticker', 'video', 'audio', 'voice', 'document']);

class InlineBotResults extends React.PureComponent {
    getThumbnailSrc(result) {
        if (result.thumb) {
            if (result.thumb.url) return result.thumb.url;
        }
        return null;
    }

    renderArticleItem(result) {
        const { onSelect } = this.props;
        return (
            <div
                key={result.id}
                className='inline-result-article'
                onMouseDown={e => {
                    e.preventDefault();
                    onSelect && onSelect(result);
                }}>
                {result.thumb_url ? (
                    <img className='inline-result-thumb' src={result.thumb_url} alt='' />
                ) : (
                    <div className='inline-result-thumb inline-result-thumb-placeholder' />
                )}
                <div className='inline-result-info'>
                    <span className='inline-result-title'>{result.title || result.id}</span>
                    {result.description && <span className='inline-result-desc'>{result.description}</span>}
                </div>
            </div>
        );
    }

    renderMediaItem(result) {
        const { onSelect } = this.props;
        const thumb = result.thumb_url || result.content_url;
        return (
            <div
                key={result.id}
                className='inline-result-media'
                onMouseDown={e => {
                    e.preventDefault();
                    onSelect && onSelect(result);
                }}
                title={result.title || ''}>
                {thumb ? (
                    <img className='inline-result-media-img' src={thumb} alt='' />
                ) : (
                    <div className='inline-result-media-placeholder'>{result.title || '?'}</div>
                )}
            </div>
        );
    }

    render() {
        const { results, botUsername, switchPmText } = this.props;
        if (!results || results.length === 0) return null;

        const isMediaMode = results.length > 0 && MEDIA_TYPES.has(results[0].type);

        return (
            <div className='inline-results-panel'>
                {botUsername && (
                    <div className='inline-results-header'>
                        <span className='inline-results-bot'>@{botUsername}</span>
                    </div>
                )}
                {switchPmText && (
                    <div className='inline-result-article inline-result-switchpm'>
                        <span className='inline-result-title'>{switchPmText}</span>
                    </div>
                )}
                <div className={isMediaMode ? 'inline-results-grid' : 'inline-results-list'}>
                    {results.map(r => (isMediaMode ? this.renderMediaItem(r) : this.renderArticleItem(r)))}
                </div>
            </div>
        );
    }
}

InlineBotResults.propTypes = {
    results: PropTypes.array,
    botUsername: PropTypes.string,
    switchPmText: PropTypes.string,
    onSelect: PropTypes.func,
};

export default InlineBotResults;
