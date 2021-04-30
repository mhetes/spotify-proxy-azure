import React from 'react';
import QRCode from 'react-qr-code';
import { Button, Callout } from '@blueprintjs/core';
import { useAppContext } from './lib/AppContext';
import Authentication from './components/Authentication';
import CurrentTrack from './components/CurrentTrack';
import Loading from './components/Loading';

export default function Player() {

    const { playerAuth } = useAppContext();
    const [ loading, setLoading ] = React.useState(true);
    const [ listenerUrl, setListenerUrl ] = React.useState(new URL(window.location.href).origin + '/Listener/');

    React.useEffect(() => {
        if (!playerAuth || !playerAuth.bearer_token || !playerAuth.player_id || !playerAuth.player_code) {
            window.location.href = '/';
            return;
        }
        if (new URL(window.location.href).pathname !== '/Player/') {
            window.location.href = '/Player/';
            return;
        }
        setListenerUrl(`${new URL(window.location.href).origin}/Listener/?player_id=${playerAuth.player_id}&player_code=${playerAuth.player_code}`);
        setLoading(false);
    }, [playerAuth, setListenerUrl, setLoading]);

    return (
        loading ? (<Loading />) : (
            <>
                <br />
                <Authentication type='Player' />
                <CurrentTrack type='Player' />
                <Callout title='QR Kód na zdieľanie prehrávača' intent='primary' >
                    <div id='qr_code'>
                        <QRCode value={listenerUrl} size={250} />
                    </div>            
                </Callout>
                <br />
                <Callout title='Link na zdieľanie prehrávača' intent='primary' >
                    <br />
                    <input type='text' className='bp4-input bp4-fill bp4-large' readOnly value={listenerUrl} />
                    <br /><br />
                    <Button intent='none' className='bp4-fill bp4-large' onClick={(e) => { navigator.clipboard.writeText(listenerUrl) }}>Kopírovať do schránky</Button>
                    <br />
                </Callout>
            </>
        )
    );
}