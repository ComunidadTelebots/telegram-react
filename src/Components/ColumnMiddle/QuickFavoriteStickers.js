import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Sticker, { StickerSourceEnum } from '../Message/Media/Sticker';
import TdLibController from '../../Controllers/TdLibController';
import FileStore from '../../Stores/FileStore';
import { loadStickerContent, loadStickerThumbnailContent } from '../../Utils/File';
import { translateSticker } from '../../Utils/GramJs/EntityTranslator';

export default function QuickFavoriteStickers({ onSelect, onClose, t }) {
    const [stickers, setStickers] = React.useState(null);
    const [failed, setFailed] = React.useState(false);
    const selected = React.useRef(false);

    React.useEffect(() => {
        let active = true;
        TdLibController.send({ '@type': 'getFavedStickers' })
            .then(result => {
                if (!active) return;
                const files = FileStore.getStore();
                const items = (result.stickers || []).filter(doc => doc.id).map(doc => {
                    const item = translateSticker(doc);
                    // The shared sticker renderer reads TDLib's photo-size shape.
                    if (item.thumbnail) item.thumbnail.photo = item.thumbnail.file;
                    loadStickerThumbnailContent(files, item);
                    loadStickerContent(files, item);
                    return item;
                });
                setStickers(items);
            })
            .catch(() => { if (active) setFailed(true); });
        return () => { active = false; };
    }, []);

    const select = sticker => {
        if (selected.current) return;
        selected.current = true;
        onSelect(sticker);
    };

    return (
        <Dialog open onClose={onClose} aria-labelledby='quick-favorite-stickers-title' maxWidth='xs'>
            <DialogTitle id='quick-favorite-stickers-title'>{t('FavoriteStickers', 'Favorite stickers')}</DialogTitle>
            <DialogContent>
                {failed ? <p role='alert'>{t('ErrorOccurred', 'Could not load stickers')}</p>
                    : !stickers ? <p role='status'>{t('Loading', 'Loading…')}</p>
                    : stickers.length === 0 ? <p>{t('NoFavoriteStickers', 'No favorite stickers yet')}</p>
                    : stickers.map((item, index) => (
                        <Button key={item.sticker.id}
                            aria-label={t('SendSticker', 'Send sticker') + ' ' + (index + 1) + ' ' + item.emoji}
                            onClick={() => select(item)}>
                            <Sticker sticker={item} autoplay={false} blur={false} displaySize={52}
                                preview source={StickerSourceEnum.PICKER} />
                        </Button>
                    ))}
            </DialogContent>
            <DialogActions><Button onClick={onClose}>{t('Close', 'Close')}</Button></DialogActions>
        </Dialog>
    );
}
