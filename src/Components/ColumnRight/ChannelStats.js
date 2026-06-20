import React from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import CircularProgress from '@material-ui/core/CircularProgress';
import TdLibController from '../../Controllers/TdLibController';
import './AdminLog.css';
import './ChannelStats.css';

class ChannelStats extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = { open: false, chatId: null, loading: false, revenue: null, starsRevenue: null };
    }

    open(chatId) {
        this.setState({ open: true, chatId, loading: true, revenue: null, starsRevenue: null });
        Promise.allSettled([
            TdLibController.send({ '@type': 'getBroadcastRevenueStats', chat_id: chatId }),
            TdLibController.send({ '@type': 'getStarsRevenueStats', chat_id: chatId }),
        ]).then(([rev, stars]) => {
            this.setState({
                loading: false,
                revenue: rev.status === 'fulfilled' ? rev.value : null,
                starsRevenue: stars.status === 'fulfilled' ? stars.value : null,
            });
        });
    }

    handleClose = () => this.setState({ open: false });

    render() {
        const { open, loading, revenue, starsRevenue } = this.state;
        if (!open) return null;

        return (
            <div className='admin-log-overlay'>
                <div className='admin-log-toolbar'>
                    <button className='admin-log-back' onClick={this.handleClose}>
                        <ArrowBackIcon />
                    </button>
                    <span className='admin-log-title'>Channel Stats</span>
                </div>
                <div className='admin-log-content'>
                    {loading && (
                        <div className='admin-log-loading'>
                            <CircularProgress size={28} />
                        </div>
                    )}
                    {!loading && (
                        <div className='channel-stats-content'>
                            {revenue && (
                                <div className='channel-stats-card'>
                                    <div className='channel-stats-card-title'>TON Revenue</div>
                                    <div className='channel-stats-card-value'>{revenue.ton_balance} TON</div>
                                </div>
                            )}
                            {starsRevenue?.status && (
                                <div className='channel-stats-card'>
                                    <div className='channel-stats-card-title'>Stars Revenue</div>
                                    <div className='channel-stats-card-value'>
                                        ⭐ {starsRevenue.status.overall_revenue}
                                    </div>
                                    <div className='channel-stats-card-sub'>
                                        Available: ⭐ {starsRevenue.status.available_balance}
                                    </div>
                                </div>
                            )}
                            {!revenue && !starsRevenue?.status && (
                                <div className='admin-log-empty'>No stats available</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default ChannelStats;
