// Official Telegram peer name colors (indices 0-13 from PeerColor TL type)
export const PEER_COLORS = [
    '#e17076',
    '#eda86c',
    '#a695e7',
    '#7bc862',
    '#6ec9cb',
    '#65aadd',
    '#ee7aae',
    '#cc5049',
    '#d4872e',
    '#8d7fd2',
    '#4d9d47',
    '#40a9a8',
    '#3d8ca6',
    '#b4638c',
];

export function getPeerColor(colorId) {
    if (colorId == null || colorId < 0) return null;
    return PEER_COLORS[colorId % PEER_COLORS.length] || null;
}
