import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import 'normalize.css/normalize.css'
import './styles.css'
import Header from './components/Header';
import Home from './Home';
import Player from './Player';
import Listener from './Listener';
import NotFound from './NotFound';
import { AppContext } from './lib/AppContext';
import { ListenerAuthentication, PlayerAuthentication } from './lib/Model'
import { VerifyLoginState, ClearLoginState, SetPlayerAuthentication, SetListenerAuthentication, GetPlayerAuthentication, GetListenerAuthentication } from './lib/LocalStorage';
import Loading from './components/Loading';
import Error from './components/Error';

function Router() {
    return (
        <BrowserRouter>
            <Switch>
                <Route exact path='/'>
                    <Home />
                </Route>
                <Route exact path='/Player'>
                    <Player />
                </Route>
                <Route exact path='/Listener'>
                    <Listener />
                </Route>
                <Route>
                    <NotFound />
                </Route>
            </Switch>
        </BrowserRouter>
    );
}

export default function App() {

    const [ firstRun, setFirstRun ] = React.useState(true);
    const [ loading, setLoading ] = React.useState(true);
    const [ errorMsg, setErrorMsg ] = React.useState('');
    const [ listenerAuth, setListenerAuth ] = React.useState(new ListenerAuthentication());
    const [ playerAuth, setPlayerAuth ] = React.useState(new PlayerAuthentication());

    const Initiate = React.useCallback(async () => {
        if (!firstRun) { return; }
        setFirstRun(false);
        let url = new URL(window.location.href);
        // Look for Spotify Player error response Params
        if (url.pathname.startsWith('/Player') && url.searchParams.get('error') && url.searchParams.get('state')) {
            setErrorMsg('Prihlásenie do služby Spotify zlyhalo! Chyba: ' + url.searchParams.get('error'));
            setLoading(false);
            return;
        }
        // Look for Spotify Player correct response Params
        if (url.pathname.startsWith('/Player') && url.searchParams.get('code') && url.searchParams.get('state')) {
            if (!VerifyLoginState(url.searchParams.get('state'))) {
                setErrorMsg('Prihlásenie do služby Spotify zlyhalo! Chyba: Nesprávny stav prihlásenia!');
                setLoading(false);
                return;
            }
            let loginPayload = {
                type: 'Player',
                code: url.searchParams.get('code'),
                callback_or_player_id: url.origin + '/Player/'
            };
            console.info(`Executing POST /api/authentication with payload: ${JSON.stringify(loginPayload, undefined, 2)}`);
            try {
                let loginRes = await fetch(`/api/authentication`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(loginPayload)
                });
                if (!loginRes.ok) {
                    console.log('Error payload: ' + JSON.stringify(await loginRes.json()));
                    throw new Error(`Invalid HTTP Status ${loginRes.status}!`);
                }
                let data = await loginRes.json();
                console.info(`POST /api/authentication returned payload: ${JSON.stringify(data)}`);
                if (!data || !data['bearer_token'] || !data['spotify_token'] || !data['spotify_expire'] || !data['spotify_country'] || !data['spotify_user_id'] || !data['spotify_user_name'] || !data['player_id'] || !data['player_code']) {
                    throw new Error(`Invalid JSON response - missing fields!`);
                }
                let auth = new PlayerAuthentication({
                    bearer_token: data['bearer_token'],
                    spotify_token: data['spotify_token'],
                    spotify_expire: data['spotify_expire'],
                    spotify_country: data['spotify_country'],
                    spotify_user_id: data['spotify_user_id'],
                    spotify_user_name: data['spotify_user_name'],
                    player_id: data['player_id'],
                    player_code: data['player_code']
                });
                ClearLoginState();
                SetPlayerAuthentication(auth);
                window.location.href = '/Player';
                return;
            } catch (e) {
                console.error('POST /api/authentication FAILED with error: ');
                console.error(e);
                setErrorMsg('Prihlásenie do služby Spotify zlyhalo! Chyba: Nesprávna odpoveď zo servera!');
                setLoading(false);
                return;
            }
        }
        // Look for Proxy Listener Params
        if (url.pathname.startsWith('/Listener') && url.searchParams.get('player_id') && url.searchParams.get('player_code')) {
            let loginPayload = {
                type: 'Listener',
                code: url.searchParams.get('player_code'),
                callback_or_player_id: url.searchParams.get('player_id')
            };
            console.info(`Executing POST /api/authentication with payload: ${JSON.stringify(loginPayload, undefined, 2)}`);
            try {
                let loginRes = await fetch(`/api/authentication`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(loginPayload)
                });
                if (!loginRes.ok) {
                    console.log('Error payload: ' + JSON.stringify(await loginRes.json()));
                    throw new Error(`Invalid HTTP Status ${loginRes.status}!`);
                }
                let data = await loginRes.json();
                console.info(`POST /api/authentication returned payload: ${JSON.stringify(data)}`);
                if (!data || !data['bearer_token'] || !data['spotify_token'] || !data['spotify_expire'] || !data['spotify_country'] || !data['spotify_user_id'] || !data['spotify_user_name']) {
                    throw new Error(`Invalid JSON response - missing fields!`);
                }
                let auth = new ListenerAuthentication({
                    bearer_token: data['bearer_token'],
                    spotify_token: data['spotify_token'],
                    spotify_expire: data['spotify_expire'],
                    spotify_country: data['spotify_country'],
                    spotify_user_id: data['spotify_user_id'],
                    spotify_user_name: data['spotify_user_name']
                });
                SetListenerAuthentication(auth);
                window.location.href = '/Listener';
                return;
            } catch (e) {
                console.error('POST /api/authentication FAILED with error: ');
                console.error(e);
                setErrorMsg('Prihlásenie do Spotify Proxy zlyhalo! Chyba: Nesprávna odpoveď zo servera!');
                setLoading(false);
                return;
            }
        }
        // Default execution
        let player_authentication = GetPlayerAuthentication();
        let listener_authentication = GetListenerAuthentication();
        if (player_authentication) {
            setPlayerAuth(player_authentication);
        }
        if (listener_authentication) {
            setListenerAuth(listener_authentication);
        }
        setLoading(false);
    }, [firstRun, setFirstRun, setLoading, setErrorMsg, setListenerAuth, setPlayerAuth]);

    /**
     * @type {() => Promise<PlayerAuthentication | null>}
     */
    const RefreshPlayerAuthentication = React.useCallback(async () => {
        console.info(`Executing GET /api/authentication with Player Bearer`);
        try {
            let fetchRes = await fetch(`/api/authentication`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${playerAuth.bearer_token}`
                }
            });
            if (!fetchRes.ok) {
                console.log('Error payload: ' + JSON.stringify(await fetchRes.json()));
                throw new Error(`Invalid HTTP Status ${fetchRes.status}!`);
            }
            let data = await fetchRes.json();
            console.info(`GET /api/authentication returned payload: ${JSON.stringify(data)}`);
            if (!data || !data['bearer_token'] || !data['spotify_token'] || !data['spotify_expire'] || !data['spotify_country'] || !data['spotify_user_id'] || !data['spotify_user_name'] || !data['spotify_user_name'] || !data['player_id'] || !data['player_code']) {
                throw new Error(`Invalid JSON response - missing fields!`);
            }
            return new PlayerAuthentication({
                bearer_token: data['bearer_token'],
                spotify_token: data['spotify_token'],
                spotify_expire: data['spotify_expire'],
                spotify_country: data['spotify_country'],
                spotify_user_id: data['spotify_user_id'],
                spotify_user_name: data['spotify_user_name'],
                player_id: data['player_id'],
                player_code: data['player_code']
            });
        } catch (e) {
            console.error('GET /api/authentication FAILED with error: ');
            console.error(e);
            return null;
        }
    }, [playerAuth.bearer_token]);

    /**
     * @type {() => Promise<ListenerAuthentication | null>}
     */
    const RefreshListenerAuthentication = React.useCallback(async () => {
        console.info(`Executing GET /api/authentication with Listener Bearer`);
        try {
            let fetchRes = await fetch(`/api/authentication`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${listenerAuth.bearer_token}`
                }
            });
            if (!fetchRes.ok) {
                console.log('Error payload: ' + JSON.stringify(await fetchRes.json()));
                throw new Error(`Invalid HTTP Status ${fetchRes.status}!`);
            }
            let data = await fetchRes.json();
            console.info(`GET /api/authentication returned payload: ${JSON.stringify(data)}`);
            if (!data || !data['bearer_token'] || !data['spotify_token'] || !data['spotify_expire'] || !data['spotify_country'] || !data['spotify_user_id'] || !data['spotify_user_name'] || !data['spotify_user_name']) {
                throw new Error(`Invalid JSON response - missing fields!`);
            }
            return new ListenerAuthentication({
                bearer_token: data['bearer_token'],
                spotify_token: data['spotify_token'],
                spotify_expire: data['spotify_expire'],
                spotify_country: data['spotify_country'],
                spotify_user_id: data['spotify_user_id'],
                spotify_user_name: data['spotify_user_name']
            });
        } catch (e) {
            console.error('GET /api/authentication FAILED with error: ');
            console.error(e);
            return null;
        }
    }, [listenerAuth.bearer_token]);

    const IntervalTick = React.useCallback(async () => {
        console.info('APP Interval started!');
        let refresh_player = false;
        let refresh_listener = false;
        if (playerAuth && playerAuth.bearer_token && playerAuth.spotify_expire) {
            refresh_player = true;
            console.info('Player Authentication active!');
        } else {
            console.info('No Player Authentication found!');
        }
        if (listenerAuth && listenerAuth.bearer_token && listenerAuth.spotify_expire) {
            refresh_listener = true;
            console.info('Listener Authentication active!');
        } else {
            console.info('No Listener Authentication found!');
        }
        let player_promise = (refresh_player) ? RefreshPlayerAuthentication() : Promise.resolve(null);
        let listener_promise = (refresh_listener) ? RefreshListenerAuthentication() : Promise.resolve(null);
        let [ player_res, listener_res ] = await Promise.all([player_promise, listener_promise]);
        if (refresh_player) {
            if (player_res) {
                SetPlayerAuthentication(player_res);
                setPlayerAuth(player_res);
            } else {
                SetPlayerAuthentication(null);
                setErrorMsg('Autorizácia prehrávača zlyhala! Zdieľanie prehrávača bolo pravdepodobne ukončené!');
            }
        }
        if (refresh_listener) {
            if (listener_res) {
                SetListenerAuthentication(listener_res);
                setListenerAuth(listener_res);
            } else {
                SetListenerAuthentication(null);
                setErrorMsg('Autorizácia prehrávača zlyhala! Zdieľanie prehrávača bolo pravdepodobne ukončené!');
            }
        }
        console.info('APP Interval ended!');
    }, [playerAuth, listenerAuth, RefreshPlayerAuthentication, RefreshListenerAuthentication, setErrorMsg]);

    React.useEffect(() => {
        if (firstRun) {
            Initiate();
        }
        let intId = setInterval(IntervalTick, 60000);
        return () => {
            clearInterval(intId);
        };
    }, [firstRun, Initiate, IntervalTick]);

    return (
        <>
            <Header key='header' />
            <div id='main'>
                <div id='page'>
                    {loading ? (
                        <Loading />
                    ) : (
                        errorMsg !== '' ? (
                            <Error errorMessage={errorMsg} />
                        ) : (
                            <AppContext.Provider value={{ listenerAuth, playerAuth }}>
                                <Router />
                            </AppContext.Provider>
                        )
                    )}
                </div>
            </div>
        </>
    );
}
