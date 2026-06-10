import React from 'react';
import CommentIcon from '@material-ui/icons/ChatBubbleOutline';
import './CommentsButton.css';

function CommentsButton({ replyCount, onClick }) {
    return (
        <button
            className='comments-btn'
            onClick={e => {
                e.stopPropagation();
                onClick();
            }}>
            <CommentIcon className='comments-btn-icon' fontSize='inherit' />
            <span className='comments-btn-label'>
                {replyCount > 0 ? `${replyCount} comment${replyCount !== 1 ? 's' : ''}` : 'Leave a comment'}
            </span>
        </button>
    );
}

export default CommentsButton;
