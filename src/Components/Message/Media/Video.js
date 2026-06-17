/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { getFitSize, getDurationString } from '../../../Utils/Common';
import { getFileSize, getSrc } from '../../../Utils/File';
import { isBlurredThumbnail } from '../../../Utils/Media';
import { PHOTO_DISPLAY_SIZE, PHOTO_SIZE } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import './Video.css';

class Video extends React.Component {
    constructor(props) {
        super(props);
        this.state = { spoilerRevealed: false };
    }

    componentDidMount() {
        FileStore.on('clientUpdateVideoThumbnailBlob', this.onClientUpdateVideoThumbnailBlob);
    }

    componentWillUnmount() {
        FileStore.off('clientUpdateVideoThumbnailBlob', this.onClientUpdateVideoThumbnailBlob);
    }

    onClientUpdateVideoThumbnailBlob = update => {
        const { thumbnail } = this.props.video;
        const { fileId } = update;

        if (!thumbnail) return;

        if (thumbnail.photo && thumbnail.photo.id === fileId) {
            this.forceUpdate();
        }
    };

    handleRevealSpoiler = e => {
        e.stopPropagation();
        this.setState({ spoilerRevealed: true });
    };

    render() {
        const { displaySize, openMedia, title, caption, type, style, hasSpoiler } = this.props;
        const { minithumbnail, thumbnail, video, width, height, duration } = this.props.video;
        const { spoilerRevealed } = this.state;
        const showSpoiler = hasSpoiler && !spoilerRevealed;

        const fitPhotoSize = getFitSize(thumbnail || { width: width, height: height }, displaySize);
        if (!fitPhotoSize) return null;

        const videoStyle = {
            width: fitPhotoSize.width,
            height: fitPhotoSize.height,
            ...style,
        };

        const miniSrc = minithumbnail ? 'data:image/jpeg;base64, ' + minithumbnail.data : null;
        const thumbnailSrc = getSrc(thumbnail ? thumbnail.photo : null);
        const isBlurred = thumbnailSrc ? isBlurredThumbnail(thumbnail) : Boolean(miniSrc);

        return (
            <div
                className={classNames('video', {
                    'video-big': type === 'message',
                    'video-title': title,
                    'video-caption': caption,
                    'video-spoiler': showSpoiler,
                    pointer: showSpoiler || openMedia,
                })}
                style={videoStyle}
                onClick={showSpoiler ? null : openMedia}>
                <img
                    className={classNames('video-preview', {
                        'media-blurred': isBlurred || showSpoiler,
                        'media-mini-blurred': !thumbnailSrc && isBlurred,
                        'video-preview-spoiler': showSpoiler,
                    })}
                    src={thumbnailSrc || miniSrc}
                    alt=''
                />
                {!showSpoiler && (
                    <div className='video-play'>
                        <PlayArrowIcon />
                    </div>
                )}
                {!showSpoiler && (
                    <div className='video-meta'>{getDurationString(duration) + ' ' + getFileSize(video)}</div>
                )}
                {!showSpoiler && duration > 0 && (
                    <div className='video-duration-overlay'>{getDurationString(duration)}</div>
                )}
                {showSpoiler && (
                    <div className='video-spoiler-overlay' onClick={this.handleRevealSpoiler}>
                        <VisibilityIcon className='video-spoiler-icon' />
                        <span className='video-spoiler-label'>Tap to reveal</span>
                    </div>
                )}
            </div>
        );
    }
}

Video.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    video: PropTypes.object.isRequired,
    openMedia: PropTypes.func,
    size: PropTypes.number,
    displaySize: PropTypes.number,
    hasSpoiler: PropTypes.bool,
};

Video.defaultProps = {
    size: PHOTO_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE,
};

export default Video;
