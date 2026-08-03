const DEFAULT_ENDPOINT = 'https://todosobreall.tech/hcgi/api/community-cards';

export const COMMUNITY_AD_PLACEMENT = 'telegram_react_channel';

export function getCommunityAdsEndpoint() {
    const configured = String(process.env.REACT_APP_COMMUNITY_ADS_URL || '').trim();
    if (!configured) return DEFAULT_ENDPOINT;
    try {
        const url = new URL(configured);
        return url.protocol === 'https:' ? url.toString().replace(/\/$/, '') : DEFAULT_ENDPOINT;
    } catch (_) {
        return DEFAULT_ENDPOINT;
    }
}

export function normalizeCommunityAd(ad) {
    if (!ad || ad.enabled === false || ad.approval_status !== 'approved') return null;
    const id = String(ad.id || '').trim();
    const title = String(ad.title || '').trim();
    if (!id || !title) return null;
    const image = String(ad.image || '').trim();
    return {
        id,
        title,
        description: String(ad.description || '').trim(),
        cta: String(ad.cta || 'Abrir').trim() || 'Abrir',
        image: /^https:\/\//i.test(image) ? image : '',
        background: String(ad.background || '').trim(),
        foreground: String(ad.foreground || '').trim(),
        accent: String(ad.accent || '').trim(),
    };
}

export function communityAdClickUrl(id) {
    return `${DEFAULT_ENDPOINT}/${encodeURIComponent(id)}/click?placement=${COMMUNITY_AD_PLACEMENT}`;
}
