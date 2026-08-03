import { communityAdClickUrl, normalizeCommunityAd } from './CommunityAds';

describe('community ads', () => {
    it('accepts only approved enabled campaigns', () => {
        expect(
            normalizeCommunityAd({ id: 'one', title: 'Canal', enabled: true, approval_status: 'approved' }),
        ).toMatchObject({ id: 'one', title: 'Canal' });
        expect(
            normalizeCommunityAd({ id: 'two', title: 'Canal', enabled: false, approval_status: 'approved' }),
        ).toBeNull();
        expect(normalizeCommunityAd({ id: 'three', title: 'Canal', approval_status: 'pending' })).toBeNull();
    });

    it('builds a measured TodoSobreAllTech click URL', () => {
        expect(communityAdClickUrl('official/channel')).toBe(
            'https://todosobreall.tech/hcgi/api/community-cards/official%2Fchannel/click?placement=telegram_react_channel',
        );
    });
});
