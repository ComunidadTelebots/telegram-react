/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import QRCode from 'qrcode';
import TdLibController from '../../Controllers/TdLibController';
import './QrCode.css';

class QrCode extends React.Component {
    constructor(props) {
        super(props);

        this.canvasRef = React.createRef();
        this.state = { loading: true, link: null };
    }

    componentDidMount() {
        this.renderQrCode();
        if (!this.props.authorizationState?.link) {
            TdLibController.send({ '@type': 'requestQrCodeAuthentication', other_user_ids: [] });
        }
    }

    componentDidUpdate(prevProps) {
        this.renderQrCode();
    }

    renderQrCode = () => {
        const { authorizationState } = this.props;
        if (!authorizationState) return;

        const link = authorizationState.link;
        if (link && link !== this.state.link) {
            this.setState({ link, loading: false }, () => {
                if (this.canvasRef.current) {
                    QRCode.toCanvas(this.canvasRef.current, link, { width: 200, margin: 1 }, err => {
                        if (err) console.error('[QrCode] render error', err);
                    });
                }
            });
        }
    };

    handleUsePhone = () => {
        const { onChangePhone } = this.props;
        if (onChangePhone) onChangePhone();
    };

    render() {
        const { t } = this.props;
        const { loading } = this.state;

        return (
            <div className='qr-auth'>
                <Typography variant='h5' className='qr-auth-title'>
                    Log in by QR Code
                </Typography>
                <Typography variant='body2' className='qr-auth-subtitle'>
                    1. Open Telegram on your phone
                    <br />
                    2. Go to <b>Settings → Devices → Scan QR Code</b>
                    <br />
                    3. Point your phone at this screen
                </Typography>
                <div className='qr-auth-canvas-wrapper'>
                    {loading ? (
                        <CircularProgress size={48} />
                    ) : (
                        <canvas ref={this.canvasRef} className='qr-auth-canvas' />
                    )}
                </div>
                <Button variant='text' color='primary' onClick={this.handleUsePhone} className='qr-auth-phone-btn'>
                    Log in by phone number
                </Button>
            </div>
        );
    }
}

export default withTranslation()(QrCode);
