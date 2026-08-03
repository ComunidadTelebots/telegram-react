import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TdLibController from '../../Controllers/TdLibController';
import BusinessEditor from './BusinessEditor';
import './BusinessInfo.css';

const DAY_NAMES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const FULL_DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function isCurrentlyOpen(workHours) {
    if (!workHours?.weekly_open) return null;
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // 0=Monday
    const minuteOfDay = now.getHours() * 60 + now.getMinutes();
    const entries = (workHours.weekly_open || []).filter(e => {
        const start = e.start_minute;
        const end = e.end_minute;
        const startDay = Math.floor(start / (24 * 60));
        const endDay = Math.floor(end / (24 * 60));
        if (startDay !== dayOfWeek) return false;
        const localStart = start % (24 * 60);
        const localEnd = end % (24 * 60);
        return minuteOfDay >= localStart && minuteOfDay < localEnd;
    });
    return entries.length > 0;
}

function buildDayRanges(workHours) {
    if (!workHours?.weekly_open) return [];
    const byDay = Array.from({ length: 7 }, () => []);
    for (const entry of workHours.weekly_open || []) {
        const start = entry.start_minute;
        const end = entry.end_minute;
        const day = Math.floor(start / (24 * 60));
        if (day >= 0 && day < 7) {
            byDay[day].push({ from: start % (24 * 60), to: end % (24 * 60) });
        }
    }
    return byDay;
}

class BusinessInfo extends Component {
    constructor(props) {
        super(props);
        this.state = { info: null, loading: true, quickReplies: [] };
    }

    componentDidMount() {
        this._load();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.userId !== this.props.userId) {
            this.setState({ info: null, loading: true, quickReplies: [] });
            this._load();
        }
    }

    _load = async () => {
        const { userId } = this.props;
        try {
            const info = await TdLibController.send({ '@type': 'getBusinessInfo', user_id: userId });
            this.setState({ info: info || {}, loading: false });
        } catch {
            this.setState({ info: {}, loading: false });
        }

        try {
            const qr = await TdLibController.send({ '@type': 'getQuickReplies' });
            if (qr?.quick_reply_shortcuts) {
                this.setState({ quickReplies: qr.quick_reply_shortcuts });
            }
        } catch {
            // quick replies may not be available
        }
    };

    render() {
        const { info, loading, quickReplies } = this.state;
        if (loading || !info) return null;

        const { work_hours, greeting_message, away_message, intro } = info;

        const hasHours = work_hours?.weekly_open?.length > 0;
        const hasGreeting = greeting_message?.text;
        const hasAway = away_message?.message?.text;
        const hasIntro = intro?.title || intro?.description;
        const hasQR = quickReplies && quickReplies.length > 0;

        if (!hasHours && !hasGreeting && !hasAway && !hasIntro && !hasQR) return null;

        const isOpen = hasHours ? isCurrentlyOpen(work_hours) : null;
        const dayRanges = hasHours ? buildDayRanges(work_hours) : [];

        return (
            <>
                <BusinessEditor ref={ref => (this.businessEditorRef = ref)} onSaved={this._load} />
                <div className='business-info'>
                    <button
                        className='business-info-edit-btn'
                        onClick={() => this.businessEditorRef && this.businessEditorRef.open(info)}>
                        Edit
                    </button>
                    {/* Business hours */}
                    {hasHours && (
                        <div className='business-section'>
                            <div className='business-section-title'>Horario</div>
                            {isOpen !== null && (
                                <div className={`business-hours-open-badge${isOpen ? '' : ' closed'}`}>
                                    <span className='dot' />
                                    <span>{isOpen ? 'Abierto ahora' : 'Cerrado ahora'}</span>
                                </div>
                            )}
                            <div className='business-hours-grid'>
                                {dayRanges.map((ranges, dayIdx) => (
                                    <React.Fragment key={dayIdx}>
                                        <span className='business-hours-day' title={FULL_DAY_NAMES[dayIdx]}>
                                            {DAY_NAMES[dayIdx]}
                                        </span>
                                        {ranges.length === 0 ? (
                                            <span className='business-hours-range business-hours-closed'>Cerrado</span>
                                        ) : (
                                            <span className='business-hours-range'>
                                                {ranges.map((r, i) => (
                                                    <span key={i}>
                                                        {i > 0 && ', '}
                                                        {minutesToTime(r.from)}–{minutesToTime(r.to)}
                                                    </span>
                                                ))}
                                            </span>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Intro */}
                    {hasIntro && (
                        <div className='business-section'>
                            <div className='business-section-title'>Presentación</div>
                            {intro.title && <div className='business-intro-title'>{intro.title}</div>}
                            {intro.description && <div className='business-text-block'>{intro.description}</div>}
                        </div>
                    )}

                    {/* Greeting message */}
                    {hasGreeting && (
                        <div className='business-section'>
                            <div className='business-section-title'>Mensaje de bienvenida</div>
                            <div className='business-text-block'>{greeting_message.text}</div>
                        </div>
                    )}

                    {/* Away message */}
                    {hasAway && (
                        <div className='business-section'>
                            <div className='business-section-title'>Mensaje de ausencia</div>
                            <div className='business-text-block'>{away_message.message.text}</div>
                        </div>
                    )}

                    {/* Quick replies */}
                    {hasQR && (
                        <div className='business-section'>
                            <div className='business-section-title'>Respuestas rápidas</div>
                            <div className='business-quick-replies'>
                                {quickReplies.slice(0, 10).map((qr, i) => (
                                    <div key={i} className='business-quick-reply'>
                                        {qr.shortcut && (
                                            <span className='business-quick-reply-shortcut'>/{qr.shortcut}</span>
                                        )}
                                        {qr.name || qr.shortcut}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </>
        );
    }
}

BusinessInfo.propTypes = {
    userId: PropTypes.number.isRequired,
};

export default BusinessInfo;
