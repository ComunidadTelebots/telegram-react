import React from 'react';
import PropTypes from 'prop-types';
import './PaidMedia.css';

class PaidMedia extends React.Component {
    render() {
        const { content } = this.props;
        const { stars_amount = 0, previews = [] } = content;

        const count = previews.length;
        const gridClass =
            count === 0
                ? 'count-1'
                : count === 1
                ? 'count-1'
                : count === 2
                ? 'count-2'
                : count === 3
                ? 'count-3'
                : 'count-many';

        const items = count > 0 ? previews : [{ '@type': 'paidMediaPreview', width: 0, height: 0, duration: 0 }];

        return (
            <div className='paid-media-wrap'>
                <div className={`paid-media-grid ${gridClass}`}>
                    {items.map((preview, i) => {
                        const isVideo = preview.duration > 0;
                        const hasRatio = preview.width > 0 && preview.height > 0;
                        return (
                            <div
                                key={i}
                                className={`paid-media-item${hasRatio ? ' has-ratio' : ''}`}
                                style={
                                    hasRatio
                                        ? { paddingBottom: `${(preview.height / preview.width) * 100}%`, height: 0 }
                                        : undefined
                                }>
                                <div className='paid-media-placeholder'>📷</div>
                                {isVideo && <span className='paid-media-video-icon'>▶</span>}
                                <div className='paid-media-overlay'>
                                    {i === 0 && (
                                        <>
                                            <span className='paid-media-star'>⭐</span>
                                            <span className='paid-media-amount'>
                                                {stars_amount > 0 ? `${stars_amount} estrellas` : 'Contenido de pago'}
                                            </span>
                                            <button className='paid-media-btn'>Desbloquear</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}

PaidMedia.propTypes = {
    content: PropTypes.shape({
        stars_amount: PropTypes.number,
        previews: PropTypes.array,
    }).isRequired,
};

export default PaidMedia;
