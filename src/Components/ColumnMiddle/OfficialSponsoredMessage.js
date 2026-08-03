import React from 'react';
import PropTypes from 'prop-types';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import ReportOutlinedIcon from '@material-ui/icons/ReportOutlined';
import SafeLink from '../Additional/SafeLink';
import TdLibController from '../../Controllers/TdLibController';

export default class OfficialSponsoredMessage extends React.PureComponent {
    static propTypes = {
        ad: PropTypes.object.isRequired,
        chatId: PropTypes.number.isRequired,
        compact: PropTypes.bool,
        onRemoved: PropTypes.func,
    };

    state = { infoOpen: false, reporting: false, reportTitle: '', reportOptions: [] };
    rootRef = React.createRef();
    viewed = false;

    componentDidMount() {
        if (!this.rootRef.current || typeof IntersectionObserver === 'undefined') return;
        this.observer = new IntersectionObserver(
            entries => {
                if (!this.viewed && entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.95)) {
                    this.viewed = true;
                    this.reportView();
                    this.observer.disconnect();
                }
            },
            { threshold: [0.95] },
        );
        this.observer.observe(this.rootRef.current);
    }

    componentWillUnmount() {
        if (this.observer) this.observer.disconnect();
    }

    reportView = () => {
        const { ad, chatId } = this.props;
        TdLibController.send({
            '@type': 'viewSponsoredMessage',
            chat_id: chatId,
            random_id_hex: ad.random_id_hex,
        }).catch(() => {});
    };

    reportClick = () => {
        const { ad, chatId } = this.props;
        TdLibController.send({
            '@type': 'clickSponsoredMessage',
            chat_id: chatId,
            random_id_hex: ad.random_id_hex,
        }).catch(() => {});
    };

    startReport = async () => {
        this.setState({ reporting: true });
        try {
            const result = await this.sendReport('');
            this.applyReportResult(result);
        } catch (_) {
            this.setState({ reporting: false });
        }
    };

    sendReport = optionHex => {
        const { ad, chatId } = this.props;
        return TdLibController.send({
            '@type': 'reportSponsoredMessage',
            chat_id: chatId,
            random_id_hex: ad.random_id_hex,
            option_hex: optionHex,
        });
    };

    applyReportResult = result => {
        if (result && result.status === 'choose') {
            this.setState({ reporting: false, reportTitle: result.title, reportOptions: result.options || [] });
            return;
        }
        this.setState({ reporting: false, reportOptions: [] });
        if (this.props.onRemoved) this.props.onRemoved(this.props.ad.random_id_hex);
    };

    selectReportOption = async optionHex => {
        this.setState({ reporting: true });
        try {
            this.applyReportResult(await this.sendReport(optionHex));
        } catch (_) {
            this.setState({ reporting: false });
        }
    };

    render() {
        const { ad, compact } = this.props;
        const { infoOpen, reporting, reportTitle, reportOptions } = this.state;
        return (
            <article ref={this.rootRef} className={`official-sponsored-message${compact ? ' is-bot-ad' : ''}`}>
                <div className='official-sponsored-heading'>
                    <span>{ad.recommended ? 'Recomendado' : 'Patrocinado por Telegram'}</span>
                    {(ad.sponsor_info || ad.additional_info) && (
                        <button type='button' onClick={() => this.setState({ infoOpen: !infoOpen })}>
                            <InfoOutlinedIcon /> Información
                        </button>
                    )}
                </div>
                <strong className='official-sponsored-title'>{ad.title}</strong>
                <p>{ad.message}</p>
                {infoOpen && (
                    <div className='official-sponsored-info'>
                        {ad.sponsor_info && <p>{ad.sponsor_info}</p>}
                        {ad.additional_info && <p>{ad.additional_info}</p>}
                    </div>
                )}
                <div className='official-sponsored-actions'>
                    <SafeLink className='official-sponsored-open' url={ad.url} onOpen={this.reportClick}>
                        {ad.button_text || 'Abrir'}
                    </SafeLink>
                    {ad.can_report && (
                        <button type='button' disabled={reporting} onClick={this.startReport}>
                            <ReportOutlinedIcon /> Informar
                        </button>
                    )}
                </div>
                {!!reportOptions.length && (
                    <div className='official-sponsored-report-options'>
                        <b>{reportTitle}</b>
                        {reportOptions.map(option => (
                            <button
                                key={option.option_hex}
                                type='button'
                                disabled={reporting}
                                onClick={() => this.selectReportOption(option.option_hex)}>
                                {option.text}
                            </button>
                        ))}
                    </div>
                )}
            </article>
        );
    }
}
