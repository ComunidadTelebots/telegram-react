import React from 'react';
import PropTypes from 'prop-types';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { communityAdClickUrl } from '../../Utils/CommunityAds';

export default function CommunityChannelAd({ ad }) {
    const style = {
        '--community-ad-background': ad.background || undefined,
        '--community-ad-foreground': ad.foreground || undefined,
        '--community-ad-accent': ad.accent || undefined,
    };

    return (
        <aside className='community-channel-ad' style={style} aria-label='Anuncio de la comunidad'>
            {ad.image && <img className='community-channel-ad-image' src={ad.image} alt='' loading='lazy' />}
            <div className='community-channel-ad-copy'>
                <span className='community-channel-ad-label'>TodoSobreAllTech · Comunidad</span>
                <strong>{ad.title}</strong>
                {ad.description && <span>{ad.description}</span>}
            </div>
            <a
                className='community-channel-ad-action'
                href={communityAdClickUrl(ad.id)}
                target='_blank'
                rel='noopener noreferrer sponsored'>
                {ad.cta}
                <OpenInNewIcon />
            </a>
        </aside>
    );
}

CommunityChannelAd.propTypes = {
    ad: PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        cta: PropTypes.string,
        image: PropTypes.string,
        background: PropTypes.string,
        foreground: PropTypes.string,
        accent: PropTypes.string,
    }).isRequired,
};
