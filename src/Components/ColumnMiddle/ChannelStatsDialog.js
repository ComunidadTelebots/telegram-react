/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
import CircularProgress from '@material-ui/core/CircularProgress';
import CloseIcon from '@material-ui/icons/Close';
import PeopleIcon from '@material-ui/icons/People';
import VisibilityIcon from '@material-ui/icons/Visibility';
import ShareIcon from '@material-ui/icons/Share';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import TdLibController from '../../Controllers/TdLibController';
import './ChannelStatsDialog.css';

class ChannelStatsDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = { open: false, loading: false, stats: null, error: null };
    }

    open = () => {
        this.setState({ open: true, loading: true, stats: null, error: null });
        this.loadStats();
    };

    loadStats = async () => {
        const { chatId } = this.props;
        try {
            const stats = await TdLibController.send({ '@type': 'getChannelStats', chat_id: chatId });
            this.setState({ stats, loading: false });
        } catch (e) {
            this.setState({ error: 'No se pudieron cargar las estadísticas.', loading: false });
        }
    };

    handleClose = () => this.setState({ open: false });

    formatNum = n => {
        if (!n && n !== 0) return '—';
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return String(n);
    };

    render() {
        const { open, loading, stats, error } = this.state;
        if (!open) return null;

        return (
            <Dialog open onClose={this.handleClose} maxWidth='xs' fullWidth>
                <DialogTitle
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: 0,
                    }}>
                    <span>Estadísticas del canal</span>
                    <IconButton size='small' onClick={this.handleClose}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent style={{ paddingBottom: 24 }}>
                    {loading && (
                        <div className='chan-stats-loading'>
                            <CircularProgress size={32} />
                        </div>
                    )}
                    {error && <p className='chan-stats-error'>{error}</p>}
                    {stats && !loading && (
                        <div className='chan-stats-grid'>
                            <div className='chan-stats-card'>
                                <PeopleIcon className='chan-stats-icon' />
                                <span className='chan-stats-value'>{this.formatNum(stats.followers_count)}</span>
                                <span className='chan-stats-label'>Suscriptores</span>
                                {stats.followers_delta !== 0 && (
                                    <span className={`chan-stats-delta ${stats.followers_delta > 0 ? 'pos' : 'neg'}`}>
                                        {stats.followers_delta > 0 ? '+' : ''}
                                        {this.formatNum(stats.followers_delta)}
                                    </span>
                                )}
                            </div>
                            <div className='chan-stats-card'>
                                <VisibilityIcon className='chan-stats-icon' />
                                <span className='chan-stats-value'>{this.formatNum(stats.views_per_post)}</span>
                                <span className='chan-stats-label'>Vistas/post</span>
                            </div>
                            <div className='chan-stats-card'>
                                <ShareIcon className='chan-stats-icon' />
                                <span className='chan-stats-value'>{this.formatNum(stats.shares_per_post)}</span>
                                <span className='chan-stats-label'>Compartidos/post</span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        );
    }
}

ChannelStatsDialog.propTypes = {
    chatId: PropTypes.number,
};

export default ChannelStatsDialog;
