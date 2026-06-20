import React from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import TdLibController from '../../Controllers/TdLibController';
import './BusinessEditor.css';

class BusinessEditor extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            saving: false,
            introTitle: '',
            introDesc: '',
            locationAddress: '',
            locationLat: '',
            locationLon: '',
        };
    }

    open(info) {
        this.setState({
            open: true,
            saving: false,
            introTitle: info?.intro?.title || '',
            introDesc: info?.intro?.description || '',
            locationAddress: info?.location?.address || '',
            locationLat: info?.location?.location?.latitude != null ? String(info.location.location.latitude) : '',
            locationLon: info?.location?.location?.longitude != null ? String(info.location.location.longitude) : '',
        });
    }

    handleClose = () => this.setState({ open: false });

    handleSaveIntro = async () => {
        this.setState({ saving: true });
        try {
            await TdLibController.send({
                '@type': 'updateBusinessIntro',
                title: this.state.introTitle,
                description: this.state.introDesc,
            });
        } catch {}
        this.setState({ saving: false });
    };

    handleSaveLocation = async () => {
        this.setState({ saving: true });
        try {
            await TdLibController.send({
                '@type': 'updateBusinessLocation',
                address: this.state.locationAddress,
                lat: this.state.locationLat ? parseFloat(this.state.locationLat) : null,
                lon: this.state.locationLon ? parseFloat(this.state.locationLon) : null,
            });
        } catch {}
        this.setState({ saving: false });
    };

    render() {
        const { open, saving, introTitle, introDesc, locationAddress, locationLat, locationLon } = this.state;
        if (!open) return null;

        return (
            <div className='business-editor-overlay'>
                <div className='business-editor-toolbar'>
                    <button className='business-editor-back' onClick={this.handleClose}>
                        <ArrowBackIcon />
                    </button>
                    <span className='business-editor-title'>Edit Business Info</span>
                </div>
                <div className='business-editor-content'>
                    <div className='business-editor-section'>
                        <div className='business-editor-section-header'>Intro</div>
                        <TextField
                            label='Title'
                            value={introTitle}
                            onChange={e => this.setState({ introTitle: e.target.value })}
                            fullWidth
                            variant='outlined'
                            size='small'
                            style={{ marginBottom: 12 }}
                        />
                        <TextField
                            label='Description'
                            value={introDesc}
                            onChange={e => this.setState({ introDesc: e.target.value })}
                            fullWidth
                            multiline
                            rows={3}
                            variant='outlined'
                            size='small'
                            style={{ marginBottom: 12 }}
                        />
                        <Button variant='contained' color='primary' disabled={saving} onClick={this.handleSaveIntro}>
                            Save Intro
                        </Button>
                    </div>
                    <div className='business-editor-section'>
                        <div className='business-editor-section-header'>Location</div>
                        <TextField
                            label='Address'
                            value={locationAddress}
                            onChange={e => this.setState({ locationAddress: e.target.value })}
                            fullWidth
                            variant='outlined'
                            size='small'
                            style={{ marginBottom: 12 }}
                        />
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                            <TextField
                                label='Latitude'
                                value={locationLat}
                                onChange={e => this.setState({ locationLat: e.target.value })}
                                variant='outlined'
                                size='small'
                                style={{ flex: 1 }}
                            />
                            <TextField
                                label='Longitude'
                                value={locationLon}
                                onChange={e => this.setState({ locationLon: e.target.value })}
                                variant='outlined'
                                size='small'
                                style={{ flex: 1 }}
                            />
                        </div>
                        <Button variant='contained' color='primary' disabled={saving} onClick={this.handleSaveLocation}>
                            Save Location
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}

export default BusinessEditor;
