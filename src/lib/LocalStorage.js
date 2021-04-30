import { ListenerAuthentication, PlayerAuthentication } from './Model';

const PlayerAuthKey = 'spotify.proxy.player.auth';
const ListenerAuthKey = 'spotify.proxy.listener.auth';
const LoginStateKey = 'spotify.proxy.login.state';

/**
 * Gets PlayerAuthentication object from LocalStorage
 * @returns {PlayerAuthentication | null}
 */
export function GetPlayerAuthentication() {
    let paStorage = localStorage.getItem(PlayerAuthKey);
    if (!paStorage) {
        return null;
    }
    try {
        let paObject = new PlayerAuthentication(JSON.parse(paStorage));
        if (!paObject || !paObject.bearer_token || !paObject.spotify_token || !paObject.spotify_expire || !paObject.spotify_country || !paObject.spotify_user_id || !paObject.spotify_user_name || !paObject.player_code) {
            localStorage.removeItem(PlayerAuthKey);
            console.warn('Invalid PlayerAuthentication object saved in LocalStorage: ');
            console.warn(paObject);
        } else {
            return paObject;
        }
    } catch (e) {
        localStorage.removeItem(PlayerAuthKey);
        console.warn('Failed to obtain PlayerAuthentication from LocalStorage with error:');
        console.warn(e);
    }
    return null;
}

/**
 * Sets PlayerAuthentication to LocalStorage. If player_authentication is NULL, then LocalStorage value is cleared
 * @param {PlayerAuthentication|null} player_authentication 
 */
export function SetPlayerAuthentication(player_authentication) {
    if (!player_authentication) {
        localStorage.removeItem(PlayerAuthKey);
    } else {
        localStorage.setItem(PlayerAuthKey, JSON.stringify(player_authentication));
    }
}

/**
 * Gets ListenerAuthentication object from LocalStorage
 * @returns {ListenerAuthentication|null}
 */
export function GetListenerAuthentication() {
    let laStorage = localStorage.getItem(ListenerAuthKey);
    if (!laStorage) {
        return null;
    }
    try {
        let laObject = new ListenerAuthentication(JSON.parse(laStorage));
        if (!laObject || !laObject.bearer_token || !laObject.spotify_token || !laObject.spotify_expire || !laObject.spotify_country || !laObject.spotify_user_id || !laObject.spotify_user_name) {
            localStorage.removeItem(ListenerAuthKey);
            console.warn('Invalid ListenerAuthentication object saved in LocalStorage: ');
            console.warn(laObject);
        } else {
            return laObject;
        }
    } catch (e) {
        localStorage.removeItem(ListenerAuthKey);
        console.warn('Failed to obtain ListenerAuthentication from LocalStorage with error:');
        console.warn(e);
    }
    return null;
}

/**
 * Sets ListenerAuthentication to LocalStorage. If listener_authentication is NULL, then LocalStorage value is cleared
 * @param {ListenerAuthentication|null} listener_authentication 
 */
export function SetListenerAuthentication(listener_authentication) {
    if (!listener_authentication) {
        localStorage.removeItem(ListenerAuthKey);
    } else {
        localStorage.setItem(ListenerAuthKey, JSON.stringify(listener_authentication));
    }
}

/**
 * Generates new random string as LoginState, saves it to LocalStorage and returns it
 * @returns {string}
 */
export function GenerateLoginState() {
    let login_state = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < 64; i++) {
        login_state += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    localStorage.setItem(LoginStateKey, login_state);
    return login_state;
}

/**
 * Verifies whether supplied login_state is same as LoginState saved in LocalStorage
 * @param {string} login_state 
 * @returns {boolean}
 */
export function VerifyLoginState(login_state) {
    let lsStorage = localStorage.getItem(LoginStateKey);
    if (!lsStorage) {
        return false;
    }
    if (typeof lsStorage !== 'string') {
        return false;
    }
    if (lsStorage !== login_state) {
        return false;
    }
    return true;
}

/**
 * Clears LoginState in LocalStorage
 */
export function ClearLoginState() {
    localStorage.removeItem(LoginStateKey)
}