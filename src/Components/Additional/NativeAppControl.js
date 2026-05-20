/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Button from '@material-ui/core/Button';
import TdLibController from '../../Controllers/TdLibController';
import { isIOS, isWindowsPhone } from '../../Utils/Common';
import './NativeAppControl.css';

class NativeAppControl extends React.Component {
    static handleInstall = () => {
        if (isIOS()) {
            window.location.href = 'https://telegram.org/dl/ios';
        } else if (isWindowsPhone()) {
            window.location.href = 'https://telegram.org/dl/wp';
        } else {
            window.location.href = 'https://telegram.org/dl/android';
        }
    };

    handleContinueWeb = () => {
        TdLibController.clientUpdate({ '@type': 'clientUpdateForceWebVersion' });
    };

    render() {
        let src = 'Android_2x.jpg';
        if (isIOS()) {
            src = 'iOS_2x.jpg';
        } else if (isWindowsPhone()) {
            src = 'WP_2x.jpg';
        }

        return (
            <div className='app-inactive'>
                <div className='app-inactive-wrapper'>
                    <img src={src} alt='' className='app-inactive-image' onClick={NativeAppControl.handleInstall} />
                    <h3 className='app-inactive-title'>Mobile not fully optimized</h3>
                    <div className='app-inactive-description'>
                        This client is not fully optimized for mobile devices yet.
                        <br />
                        For the best experience, use our native app.
                    </div>
                    <div className='app-inactive-actions'>
                        <Button color='primary' onClick={NativeAppControl.handleInstall}>
                            Install app
                        </Button>
                        <Button color='default' onClick={this.handleContinueWeb}>
                            Continue in browser
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}

export default NativeAppControl;
