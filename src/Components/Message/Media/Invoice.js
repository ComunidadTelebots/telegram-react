/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart';
import { getSrc } from '../../../Utils/File';
import './Invoice.css';

class Invoice extends React.Component {
    render() {
        const { invoice } = this.props;
        if (!invoice) return null;

        const { title, description, photo, currency, total_amount, is_test } = invoice;

        const formattedAmount =
            currency && total_amount != null
                ? new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(total_amount / 100)
                : null;

        return (
            <div className='invoice'>
                {photo && photo.sizes && photo.sizes.length > 0 && (
                    <div className='invoice-photo'>
                        <img
                            className='invoice-photo-image'
                            src={getSrc(photo.sizes[0]?.photo) || ''}
                            alt={title}
                            draggable={false}
                        />
                    </div>
                )}
                <div className='invoice-content'>
                    <div className='invoice-title'>{title}</div>
                    {description && <div className='invoice-description'>{description}</div>}
                    <div className='invoice-footer'>
                        <ShoppingCartIcon className='invoice-icon' />
                        <span className='invoice-price'>{formattedAmount || currency}</span>
                        {is_test && <span className='invoice-test'>TEST</span>}
                    </div>
                </div>
            </div>
        );
    }
}

Invoice.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    invoice: PropTypes.object.isRequired
};

export default Invoice;
