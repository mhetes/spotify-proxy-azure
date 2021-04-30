import React from 'react';
import { Button, Callout } from '@blueprintjs/core';
import { useAppContext } from '../lib/AppContext';
import { SetPlayerAuthentication, SetListenerAuthentication } from '../lib/LocalStorage';

/**
 * @param {{type: 'Player' | 'Listener'}} props 
 * @returns {JSX.Element}
 */
export default function Authentication(props) {

    const { playerAuth, listenerAuth } = useAppContext();
    const [ username, setUsername ] = React.useState('');
    const [ fullname, setFullname ] = React.useState('');
    const [ country, setCountry ] = React.useState('');
    const [ show, setShow ] = React.useState(false);

    React.useEffect(() => {
        if (props.type === 'Player') {
            if (playerAuth && playerAuth.spotify_user_id && playerAuth.spotify_user_name && playerAuth.spotify_country) {
                setUsername(playerAuth.spotify_user_id);
                setFullname(playerAuth.spotify_user_name);
                setCountry(playerAuth.spotify_country);
                setShow(true);
            } else {
                setShow(false);
            }
        } else if (props.type === 'Listener') {
            if (listenerAuth && listenerAuth.spotify_user_id && listenerAuth.spotify_user_name && listenerAuth.spotify_country) {
                setUsername(listenerAuth.spotify_user_id);
                setFullname(listenerAuth.spotify_user_name);
                setCountry(listenerAuth.spotify_country);
                setShow(true);
            } else {
                setShow(false);
            }
        } else {
            setShow(false);
        }
    }, [props.type, playerAuth, listenerAuth, setUsername, setFullname, setCountry, setShow]);

    const ExecAuthenticationDelete = React.useCallback(async () => {
        let bearer = '';
        if (props.type === 'Player') {
            bearer = (playerAuth && playerAuth.bearer_token) ? playerAuth.bearer_token : '';
        } else if (props.type === 'Listener') {
            bearer = (listenerAuth && listenerAuth.bearer_token) ? listenerAuth.bearer_token : '';
        }
        if (bearer === '') {
            return;
        }
        console.info(`Executing DELETE /api/authentication with ${props.type} bearer`);
        try {
            let logoutRes = await fetch(`/api/authentication`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${bearer}`
                }
            });
            if (!logoutRes.ok) {
                console.log('Error payload: ' + JSON.stringify(await logoutRes.json()));
                throw new Error(`Invalid HTTP Status ${logoutRes.status}!`);
            }
            console.info(`DELETE /api/authentication call finalized!`);
        } catch (e) {
            console.error('DELETE /api/authentication FAILED with error: ');
            console.error(e);
            return;
        }
    }, [props.type, playerAuth, listenerAuth]);

    const LogoutClick = React.useCallback(async () => {
        setShow(false);
        await ExecAuthenticationDelete();
        if (props.type === 'Player') {
            SetPlayerAuthentication(null);
        } else if (props.type === 'Listener') {
            SetListenerAuthentication(null);
        }
        window.location.href = '/';
    }, [props.type, ExecAuthenticationDelete]);

    return (
        show ? (
            <>
                <Callout title='Spotify prehrávač - Prihlásenie' intent='success' >
                    <Button className='logout_button' intent='danger' icon='log-out' onClick={(e) => { LogoutClick(); }}>Odhlásiť</Button>
                    <strong>Nick:</strong> {username}<br />
                    <strong>Meno:</strong> {fullname}<br />
                    <strong>Štát:</strong> {country}<br />
                </Callout>
                <br />
            </>
        ) : (<></>)
    );
}