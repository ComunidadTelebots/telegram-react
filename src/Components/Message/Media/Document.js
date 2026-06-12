/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import VisibilityIcon from '@material-ui/icons/Visibility';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import DocumentTile from '../../Tile/DocumentTile';
import DocumentAction from './DocumentAction';
import { getExtension } from '../../../Utils/File';
import FileStore from '../../../Stores/FileStore';
import './Document.css';

class Document extends React.Component {
    constructor(props) {
        super(props);
        this.state = { pdfOpen: false, blobUrl: null };
    }

    componentWillUnmount() {
        if (this.state.blobUrl) {
            URL.revokeObjectURL(this.state.blobUrl);
        }
    }

    handlePdfPreview = async e => {
        e.stopPropagation();
        const { document } = this.props;
        if (!document) return;

        const file = document.document;
        if (!file) return;

        // If already has local blob URL
        if (this.state.blobUrl) {
            this.setState({ pdfOpen: true });
            return;
        }

        // Try to get blob from FileStore
        const blob = FileStore.getBlob(file.id) || FileStore.getBlob(file.remote && file.remote.id);
        if (blob) {
            const url = URL.createObjectURL(blob);
            this.setState({ blobUrl: url, pdfOpen: true });
            return;
        }

        // File not yet downloaded — just open download
        this.props.openMedia && this.props.openMedia(e);
    };

    render() {
        const { document, openMedia, width, height } = this.props;
        if (!document) return null;

        const { minithumbnail, thumbnail, file_name } = document;
        const file = document.document;
        const ext = getExtension(file_name || '').toLowerCase();
        const isPdf = ext === 'pdf';

        const style = width && height ? { width, height } : null;
        const { pdfOpen, blobUrl } = this.state;

        return (
            <div className='document' style={style}>
                <DocumentTile
                    minithumbnail={minithumbnail}
                    thumbnail={thumbnail}
                    file={file}
                    openMedia={openMedia}
                    icon={<ArrowDownwardIcon />}
                    completeIcon={<InsertDriveFileIcon />}
                />
                <div className='document-content'>
                    <div className='document-title'>
                        <a
                            className='document-name'
                            onClick={openMedia}
                            title={file_name}
                            data-name={file_name}
                            data-ext={'.' + getExtension(file_name)}>
                            {file_name}
                        </a>
                        {isPdf && (
                            <IconButton
                                size='small'
                                title='Vista previa PDF'
                                onClick={this.handlePdfPreview}
                                style={{ marginLeft: 4, padding: 2 }}>
                                <VisibilityIcon fontSize='small' />
                            </IconButton>
                        )}
                    </div>
                    <DocumentAction file={file} />
                </div>
                {isPdf && pdfOpen && blobUrl && (
                    <Dialog open maxWidth='lg' fullWidth onClose={() => this.setState({ pdfOpen: false })}>
                        <DialogTitle
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingBottom: 0,
                            }}>
                            <span>{file_name}</span>
                            <IconButton size='small' onClick={() => this.setState({ pdfOpen: false })}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent style={{ padding: 0, height: '80vh' }}>
                            <iframe
                                src={blobUrl}
                                title={file_name}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                            />
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        );
    }
}

Document.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    document: PropTypes.object.isRequired,
    openMedia: PropTypes.func,
    width: PropTypes.number,
    height: PropTypes.number,
};

export default Document;
