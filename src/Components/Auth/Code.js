/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@material-ui/core/Button';
import { acceptsText, validCode } from '../../Utils/LoginCode';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/EditOutlined';
import TextField from '@material-ui/core/TextField';
import HeaderProgress from '../ColumnMiddle/HeaderProgress';
import { cleanProgressStatus, formatPhoneNumber, isConnecting } from './Phone';
import AppStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './Code.css';

const hints = {
    TelegramMessage: ['Busca el código en el chat de servicio Telegram de un dispositivo con la sesión abierta.', 'Check the Telegram service chat on a device where you are signed in.'],
    Sms: ['Introduce el código recibido por SMS.', 'Enter the code from the text message.'],
    Call: ['Introduce el código de la llamada de Telegram.', 'Enter the code from the Telegram call.'],
    MissedCall: ['Introduce las últimas cifras del número que te ha llamado.', 'Enter the final digits of the number that called you.'],
    FlashCall: ['Introduce el número desde el que te ha llamado Telegram.', 'Enter the number that Telegram called you from.'],
    Email: ['Introduce el código enviado a tu correo.', 'Enter the code sent to your email.'],
    Fragment: ['Consulta el código en tu cuenta de Fragment.', 'Check your Fragment account for the code.'],
    SmsWord: ['Introduce la palabra recibida por SMS.', 'Enter the word from the text message.'],
    SmsPhrase: ['Introduce la frase recibida por SMS.', 'Enter the phrase from the text message.'],
    Unsupported: ['Este método requiere otro cliente. Puedes volver y acceder con QR.', 'This method requires another client. Go back to sign in with QR.']
};

function Code({ codeInfo, onChangePhone, i18n, t }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [now, setNow] = useState(Date.now);
    const [connecting, setConnecting] = useState(() => isConnecting(AppStore.connectionState));
    const pending = useRef(false);
    const type = codeInfo.type;
    const method = type?.['@type']?.replace('authenticationCodeType', '');
    const supported = Boolean(hints[method]) && method !== 'Unsupported';
    const lang = i18n.language?.toLowerCase().startsWith('es') ? 0 : 1;
    const deadline = useMemo(() => codeInfo.resend_at ?? Date.now() + (codeInfo.timeout || 0) * 1000, [codeInfo]);
    const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));

    useEffect(() => {
        const update = ({ state }) => setConnecting(isConnecting(state));
        AppStore.on('updateConnectionState', update);
        TdLibController.clientUpdate({ '@type': 'clientUpdateMonkeyIdle' });
        return () => AppStore.off('updateConnectionState', update);
    }, []);

    useEffect(() => {
        setCode('');
        setError('');
        setNow(Date.now());
        if (!codeInfo.next_type || deadline <= Date.now()) return;
        const timer = setInterval(() => {
            const time = Date.now();
            setNow(time);
            if (time >= deadline) clearInterval(timer);
        }, 500);
        return () => clearInterval(timer);
    }, [codeInfo, deadline]);

    async function send(request) {
        if (pending.current) return;
        pending.current = true;
        setBusy(true);
        setError('');
        try {
            await TdLibController.send(request);
        } catch (err) {
            const message = err?.errorMessage || err?.message;
            setError(message === 'PHONE_CODE_INVALID' ? t('InvalidCode') : message || t('Error'));
        } finally {
            pending.current = false;
            setBusy(false);
        }
    }

    function submit(value) {
        if (supported && validCode(value, type)) {
            send({ '@type': 'checkAuthenticationCode', code: value.trim() });
        } else {
            setError(t('InvalidCode'));
        }
    }

    function change(event) {
        const value = event.target.value;
        setCode(value);
        setError('');
        TdLibController.clientUpdate({
            '@type': 'clientUpdateMonkeyTracking',
            prevCode: '*'.repeat(code.length),
            code: '*'.repeat(value.length)
        });
        if (supported && type.length && !acceptsText(type) && validCode(value, type)) submit(value);
    }

    return (
        <form className='auth-root' onSubmit={event => { event.preventDefault(); submit(code); }}>
            <div className={classNames('code-title', 'auth-title')}>
                <Typography variant='body1' className='auth-title-typography'>
                    <span>{connecting ? cleanProgressStatus(t('Connecting')) : formatPhoneNumber(codeInfo.phone_number)}</span>
                    {connecting && <HeaderProgress />}
                </Typography>
                <IconButton type='button' aria-label={lang ? 'Change phone number' : 'Cambiar número'} onClick={onChangePhone} disabled={busy}>
                    <EditIcon fontSize='small' />
                </IconButton>
            </div>
            <Typography variant='body1' className='auth-subtitle' style={{ width: 300 }}>
                {(hints[method] || hints.Unsupported)[lang]} {type?.email_pattern}
            </Typography>
            {supported && <>
                <TextField classes={{ root: 'auth-input' }} variant='outlined' color='primary'
                    disabled={busy} error={Boolean(error)} helperText={error} fullWidth autoFocus
                    value={code} onChange={change} label={t('Code')} autoComplete='one-time-code'
                    inputProps={{ inputMode: acceptsText(type) ? 'text' : 'numeric', maxLength: type.length || undefined }} />
                <Button type='submit' color='primary' variant='contained' disabled={busy || !validCode(code, type)}>{t('Next')}</Button>
            </>}
            {!supported && error && <Typography role='alert'>{error}</Typography>}
            {codeInfo.next_type && <Button type='button' color='primary' disabled={busy || seconds > 0}
                onClick={() => send({ '@type': 'resendAuthenticationCode' })}>
                {lang ? 'Resend code' : 'Reenviar código'}{seconds > 0 && ` (${seconds} s)`}
            </Button>}
        </form>
    );
}

export default withTranslation()(Code);
