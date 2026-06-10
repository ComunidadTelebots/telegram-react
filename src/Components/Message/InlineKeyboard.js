import React from 'react';
import TdLibController from '../../Controllers/TdLibController';
import './InlineKeyboard.css';

function showCallbackToast(text) {
    const el = document.createElement('div');
    el.className = 'callback-toast';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('callback-toast--visible'), 10);
    setTimeout(() => {
        el.classList.remove('callback-toast--visible');
        setTimeout(() => document.body.removeChild(el), 300);
    }, 3000);
}

function InlineKeyboard({ chatId, messageId, replyMarkup }) {
    if (!replyMarkup || replyMarkup['@type'] !== 'replyMarkupInlineKeyboard') return null;
    const { rows } = replyMarkup;
    if (!rows || !rows.length) return null;

    const handleClick = async (e, btn) => {
        e.stopPropagation();
        const type = btn['@type'];
        if (type === 'inlineKeyboardButtonTypeUrl' || type === 'inlineKeyboardButtonTypeWebApp') {
            window.open(btn.url, '_blank', 'noopener,noreferrer');
        } else if (type === 'inlineKeyboardButtonTypeCallback') {
            try {
                const answer = await TdLibController.send({
                    '@type': 'getCallbackQueryAnswer',
                    chat_id: chatId,
                    message_id: messageId,
                    payload: { '@type': 'callbackQueryPayloadData', data: btn.data },
                });
                if (answer && answer.text) {
                    if (answer.show_alert) {
                        window.alert(answer.text);
                    } else {
                        showCallbackToast(answer.text);
                    }
                }
                if (answer && answer.url) {
                    window.open(answer.url, '_blank', 'noopener,noreferrer');
                }
            } catch {}
        } else if (type === 'inlineKeyboardButtonTypeSwitchInline') {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateSwitchInlineQuery',
                query: btn.query,
                in_current_chat: btn.in_current_chat,
                chat_id: chatId,
            });
        }
    };

    return (
        <div className='inline-keyboard'>
            {rows.map((row, ri) => (
                <div key={ri} className='inline-keyboard-row'>
                    {row.buttons.map((btn, bi) => (
                        <button key={bi} className='inline-keyboard-btn' onClick={e => handleClick(e, btn)}>
                            {btn.text}
                        </button>
                    ))}
                </div>
            ))}
        </div>
    );
}

export default InlineKeyboard;
