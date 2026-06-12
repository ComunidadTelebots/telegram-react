/*
 * Desktop notification manager — fires a browser notification for new incoming
 * messages when the tab/window does not have focus.
 */

import MessageStore from '../Stores/MessageStore';
import ChatStore from '../Stores/ChatStore';
import UserStore from '../Stores/UserStore';
import ApplicationStore from '../Stores/ApplicationStore';
import FileStore from '../Stores/FileStore';
import { getChatTitle } from './Chat';
import { openChat } from '../Actions/Client';

class NotificationManager {
    constructor() {
        this._granted = false;
        this._requestedPermission = false;
    }

    init() {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            this._granted = true;
        } else if (Notification.permission !== 'denied' && !this._requestedPermission) {
            this._requestedPermission = true;
            Notification.requestPermission().then(permission => {
                this._granted = permission === 'granted';
            });
        }

        MessageStore.on('updateNewMessage', this.onUpdateNewMessage);
    }

    destroy() {
        MessageStore.off('updateNewMessage', this.onUpdateNewMessage);
    }

    onUpdateNewMessage = update => {
        if (!this._granted) return;
        if (window.hasFocus) return;

        const { message } = update;
        if (!message) return;
        if (message.is_outgoing) return;

        const { chat_id, sender_user_id, content } = message;

        const currentChatId = ApplicationStore.getChatId();
        if (currentChatId === chat_id && window.hasFocus) return;

        const chatTitle = getChatTitle(chat_id) || 'Telegram';

        let body = '';
        if (content) {
            switch (content['@type']) {
                case 'messageText':
                    body = content.text?.text || '';
                    break;
                case 'messagePhoto':
                    body = content.caption?.text || '📷 Photo';
                    break;
                case 'messageVideo':
                    body = content.caption?.text || '🎥 Video';
                    break;
                case 'messageDocument':
                    body = content.document?.file_name || '📄 File';
                    break;
                case 'messageSticker':
                    body = `${content.sticker?.emoji || ''} Sticker`;
                    break;
                case 'messageVoiceNote':
                    body = '🎤 Voice message';
                    break;
                case 'messageAnimation':
                    body = '🎬 GIF';
                    break;
                default:
                    body = content['@type']
                        .replace('message', '')
                        .replace(/([A-Z])/g, ' $1')
                        .trim();
            }
        }

        // Use chat photo blob as notification icon if available
        let icon = '/favicon.ico';
        try {
            const chat = ChatStore.get(chat_id);
            const photoFile = chat?.photo?.small;
            if (photoFile) {
                const blob = FileStore.getBlob(photoFile.id);
                if (blob) icon = URL.createObjectURL(blob);
            }
        } catch {}

        // Show sender name for group chats
        let title = chatTitle;
        if (sender_user_id) {
            const user = UserStore.get(sender_user_id);
            if (user) {
                const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
                if (name && name !== chatTitle) title = `${name} → ${chatTitle}`;
            }
        }

        try {
            const n = new Notification(title, {
                body: body.substring(0, 120),
                icon,
                tag: `tg_msg_${chat_id}`,
                silent: false,
            });

            n.onclick = () => {
                window.focus();
                openChat(chat_id);
                n.close();
            };

            setTimeout(() => n.close(), 6000);
        } catch (e) {
            /* ignore */
        }
    };
}

export default new NotificationManager();
