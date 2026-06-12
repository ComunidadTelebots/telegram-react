/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component } from 'react';
import TdLibController from '../Controllers/TdLibController';

function isNightHour() {
    const hour = new Date().getHours();
    return hour >= 21 || hour < 7;
}

class NightModeAuto extends Component {
    componentDidMount() {
        this.applyTheme();
        this.timer = setInterval(() => this.applyTheme(), 60 * 1000);
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    applyTheme() {
        const night = isNightHour();
        TdLibController.clientUpdate({ '@type': 'clientUpdateThemeChanging', night });
    }

    render() {
        return null;
    }
}

export default NightModeAuto;
