/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import { compose } from 'recompose';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import InsertEmoticonIcon from '../../Assets/Icons/Smile';
import { Picker as EmojiPicker } from 'emoji-mart';
import { usesEraFeatures } from '../../Design';
import QuickFavoriteStickers from './QuickFavoriteStickers';
import StickerPreview from './StickerPreview';
import StickersPicker from './StickersPicker';
import { isAppleDevice } from '../../Utils/Common';
import { loadStickerThumbnailContent, loadStickerSetContent, loadRecentStickersContent } from '../../Utils/File';
import { EMOJI_PICKER_TIMEOUT_MS } from '../../Constants';
import ApplicationStore from '../../Stores/ApplicationStore';
import FileStore from '../../Stores/FileStore';
import LocalizationStore from '../../Stores/LocalizationStore';
import TdLibController from '../../Controllers/TdLibController';
import './EmojiPickerButton.css';

const styles = theme => ({
    pickerRoot: {
        zIndex: theme.zIndex.modal,
        width: 338,
        overflowX: 'hidden',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[8],
        position: 'absolute',
        bottom: 54,
        display: 'none',
    },
    pickerRootOpened: {
        display: 'block',
    },
});

class EmojiPickerButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
            tab: 0,
            emojiGroups: [],
            favoritesChatId: null,
            eraOnly: usesEraFeatures(),
        };

        this.emojiPickerRef = React.createRef();
        this.stickersPickerRef = React.createRef();
    }

    componentDidMount() {
        ApplicationStore.on('clientUpdateDesignCapabilities', this.onDesignCapabilities);
        ApplicationStore.on('clientUpdateThemeChange', this.onClientUpdateChange);
        LocalizationStore.on('clientUpdateLanguageChange', this.onClientUpdateChange);
        TdLibController.on('clientUpdateOpenStickersPanel', this.onClientUpdateOpenStickersPanel);
        TdLibController.send({ '@type': 'getEmojiGroups' })
            .then(r => this.setState({ emojiGroups: r.groups || [] }))
            .catch(() => {});
    }

    componentWillUnmount() {
        ApplicationStore.off('clientUpdateDesignCapabilities', this.onDesignCapabilities);
        ApplicationStore.off('clientUpdateThemeChange', this.onClientUpdateChange);
        LocalizationStore.off('clientUpdateLanguageChange', this.onClientUpdateChange);
        TdLibController.off('clientUpdateOpenStickersPanel', this.onClientUpdateOpenStickersPanel);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.chatId !== this.props.chatId) {
            this.press = null;
            this.openFavoritesOnClick = false;
            if (this.state.favoritesChatId !== null) this.closeFavorites();
        }
    }

    onDesignCapabilities = () => this.setState({ eraOnly: usesEraFeatures(), favoritesChatId: null });

    openFavorites = () => {
        if (usesEraFeatures()) return;
        this.buttonEnter = false;
        this.paperEnter = false;
        this.setState({ open: false, favoritesChatId: this.props.chatId });
    };

    closeFavorites = () => this.setState({ favoritesChatId: null });

    startPress = event => {
        this.openFavoritesOnClick = false;
        this.press = event.isPrimary !== false && event.button === 0
            ? { id: event.pointerId, time: event.timeStamp, x: event.clientX, y: event.clientY }
            : null;
    };

    movePress = event => {
        if (this.press && (event.pointerId !== this.press.id ||
            Math.hypot(event.clientX - this.press.x, event.clientY - this.press.y) > 10)) {
            this.press = null;
        }
    };

    finishPress = event => {
        this.movePress(event);
        this.openFavoritesOnClick = Boolean(this.press && event.timeStamp - this.press.time >= 500);
        this.press = null;
    };

    cancelPress = () => { this.press = null; };

    handlePickerClick = () => {
        if (this.openFavoritesOnClick && !this.state.eraOnly) {
            this.openFavoritesOnClick = false;
            this.openFavorites();
        } else {
            this.updatePicker(true);
            this.loadStickerSets();
        }
    };

    onClientUpdateOpenStickersPanel = () => {
        this.updatePicker(true);
        this.loadStickerSets().then(() => {
            this.handleStickersClick();
        });
    };

    onClientUpdateChange = update => {
        this.picker = null;
    };

    handleButtonMouseEnter = event => {
        this.buttonEnter = true;
        setTimeout(() => {
            if (!this.buttonEnter) return;

            this.updatePicker(true);
            this.loadStickerSets();
        }, EMOJI_PICKER_TIMEOUT_MS);
    };

    loadStickerSets = async () => {
        if (this.sets) return;

        this.recent = await TdLibController.send({
            '@type': 'getRecentStickers',
            is_attached: false,
        });

        this.stickerSets = await TdLibController.send({
            '@type': 'getInstalledStickerSets',
            is_masks: false,
        });

        const promises = [];
        this.stickerSets.sets.forEach(x => {
            promises.push(
                TdLibController.send({
                    '@type': 'getStickerSet',
                    set_id: x.id,
                }),
            );
        });

        this.sets = await Promise.all(promises);

        const node = this.stickersPickerRef.current;

        const store = FileStore.getStore();
        loadRecentStickersContent(store, this.recent);

        const previewSets = this.sets.slice(0, 5).reverse();
        previewSets.forEach(x => {
            loadStickerSetContent(store, x);
            node.loadedSets.set(x.id, x.id);
        });

        const previewStickers = this.sets.reduce((stickers, set) => {
            if (set.stickers.length > 0) {
                stickers.push(set.stickers[0]);
            }
            return stickers;
        }, []);
        previewStickers.forEach(x => {
            loadStickerThumbnailContent(store, x);
        });
    };

    handleButtonMouseLeave = () => {
        this.buttonEnter = false;
        setTimeout(() => {
            this.tryClosePicker();
        }, EMOJI_PICKER_TIMEOUT_MS);
    };

    tryClosePicker = () => {
        const { sticker } = this.state;
        if (this.paperEnter || this.buttonEnter || sticker) return;

        this.updatePicker(false);
    };

    handlePaperMouseEnter = () => {
        this.paperEnter = true;
    };

    handlePaperMouseLeave = () => {
        // return;

        this.paperEnter = false;
        setTimeout(() => {
            this.tryClosePicker();
        }, EMOJI_PICKER_TIMEOUT_MS);
    };

    updatePicker = open => {
        this.setState({ open });
    };

    handleEmojiClick = () => {
        this.setState({ tab: 0 });
    };

    handleStickersClick = () => {
        const stickersPicker = this.stickersPickerRef.current;
        const { tab } = this.state;

        stickersPicker.loadContent(this.recent, this.stickerSets, this.sets);

        this.setState({ tab: 1 });
        if (tab === 1) {
            stickersPicker.scrollTop();
        }
    };

    handleStickerSend = sticker => {
        if (!sticker) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateStickerSend',
            sticker,
        });

        this.updatePicker(false);
    };

    handleStickerPreview = sticker => {
        this.setState({ sticker });
        TdLibController.clientUpdate({
            '@type': 'clientUpdateStickerPreview',
            sticker,
        });

        if (!sticker) {
            this.tryClosePicker();
        }
    };

    render() {
        const { classes, theme, t } = this.props;
        const { open, tab, sticker, emojiGroups } = this.state;

        if (open && !this.picker) {
            const i18n = {
                search: t('Search'),
                notfound: t('NotEmojiFound'),
                skintext: t('ChooseDefaultSkinTone'),
                categories: {
                    search: t('SearchResults'),
                    recent: t('Recent'),
                    people: t('SmileysPeople'),
                    nature: t('AnimalsNature'),
                    foods: t('FoodDrink'),
                    activity: t('Activity'),
                    places: t('TravelPlaces'),
                    objects: t('Objects'),
                    symbols: t('Symbols'),
                    flags: t('Flags'),
                    custom: t('Custom'),
                },
            };

            this.picker = (
                <EmojiPicker
                    ref={this.emojiPickerRef}
                    set='apple'
                    showPreview={false}
                    showSkinTones={false}
                    onSelect={this.props.onSelect}
                    color={theme.palette.primary.dark}
                    i18n={i18n}
                    native={isAppleDevice()}
                    style={{ width: 338, overflowX: 'hidden' }}
                />
            );

            this.stickersPicker = (
                <StickersPicker
                    ref={this.stickersPickerRef}
                    onSelect={this.handleStickerSend}
                    onPreview={this.handleStickerPreview}
                />
            );
        }

        return (
            <>
                <link
                    rel='stylesheet'
                    type='text/css'
                    href={theme.palette.type === 'dark' ? 'emoji-mart.dark.css' : 'emoji-mart.light.css'}
                />
                <IconButton
                    className='inputbox-icon-button'
                    aria-label='Emoticon'
                    title={this.state.eraOnly ? t('Emoji') : t('QuickFavoriteStickersHint', 'Hold for favorite stickers')}
                    onPointerDown={this.startPress}
                    onPointerMove={this.movePress}
                    onPointerUp={this.finishPress}
                    onPointerCancel={this.cancelPress}
                    onPointerLeave={this.cancelPress}
                    onContextMenu={event => { if (this.press) event.preventDefault(); }}
                    onClick={this.handlePickerClick}
                    onMouseEnter={this.handleButtonMouseEnter}
                    onMouseLeave={this.handleButtonMouseLeave}>
                    <InsertEmoticonIcon />
                </IconButton>
                <div
                    className={classNames(classes.pickerRoot, { [classes.pickerRootOpened]: open })}
                    onMouseEnter={this.handlePaperMouseEnter}
                    onMouseLeave={this.handlePaperMouseLeave}>
                    <div className='emoji-picker-header'>
                        <Button
                            color={tab === 0 ? 'primary' : 'default'}
                            className='emoji-picker-header-button'
                            onClick={this.handleEmojiClick}>
                            {t('Emoji')}
                        </Button>
                        <Button
                            color={tab === 1 ? 'primary' : 'default'}
                            className='emoji-picker-header-button'
                            onClick={this.handleStickersClick}>
                            {t('Stickers')}
                        </Button>
                        {!this.state.eraOnly && (
                            <Button className='emoji-picker-header-button' onClick={this.openFavorites}>
                                {t('Favorites', 'Favorites')}
                            </Button>
                        )}
                    </div>
                    {tab === 0 && emojiGroups.length > 0 && (
                        <div className='emoji-groups-bar'>
                            {emojiGroups.map((g, i) => (
                                <button
                                    key={i}
                                    className='emoji-group-btn'
                                    title={g.title}
                                    onClick={() => {
                                        const em = g.emoticons && g.emoticons[0];
                                        if (em && this.props.onSelect) this.props.onSelect({ native: em, id: em });
                                    }}>
                                    {g.emoticons && g.emoticons[0]}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className={classNames('emoji-picker-content', { 'emoji-picker-content-stickers': tab === 1 })}>
                        {this.picker}
                        {this.stickersPicker}
                    </div>
                    {Boolean(sticker) && <StickerPreview sticker={sticker} />}
                </div>
                {this.state.favoritesChatId != null && this.state.favoritesChatId === this.props.chatId && (
                    <QuickFavoriteStickers
                        t={t}
                        onClose={this.closeFavorites}
                        onSelect={item => {
                            this.closeFavorites();
                            this.handleStickerSend(item);
                        }}
                    />
                )}
            </>
        );
    }
}

const enhance = compose(withStyles(styles, { withTheme: true }), withTranslation());

export default enhance(EmojiPickerButton);
