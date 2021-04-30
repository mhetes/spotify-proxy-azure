import { Context } from '@azure/functions';
import { GetSpotifyAppCode, GetSpotifyAppSecret } from './EnvironmentVariables';
import { httpGet, httpPost } from './HttpClient';

function throwIfMissingVariables(context: Context) {
    let doThrow = false;
    if (!GetSpotifyAppCode()) {
        doThrow = true;
        context.log.error(`Missing Environment variable for: SpotifyAppCode`);
    }
    if (!GetSpotifyAppSecret()) {
        doThrow = true;
        context.log.error(`Missing Environment variable for: SpotifyAppSecret`);
    }
    if (doThrow) {
        throw new Error(`Missing Spotify Configuration!`);
    }
}

interface SpotifyAppCredentials {
    AccessToken: string;
    TokenValidUntil: Date;
}

interface SpotifyRefreshCredentials extends SpotifyAppCredentials {
    Scopes: string;
}

interface SpotifyUserCredentials extends SpotifyRefreshCredentials {
    RefreshToken: string;
}

interface SpotifyCurrentTrack {
    track_id: string | null;
    is_playing: boolean | null;
    progress_ms: number | null;
}

interface SpotifyUserProfile {
    user_id: string | null;
    display_name: string | null;
    country: string | null;
}

export class Spotify {

    public static async AuthenticateWithCodeFlow(code: string, callback_uri: string, context: Context): Promise<SpotifyUserCredentials> {
        context.log.info(`Spotify.AuthenticateWithCodeFlow('${code}')`);
        throwIfMissingVariables(context);
        try {
            let req = httpPost('https://accounts.spotify.com/api/token')
                .authBasic(GetSpotifyAppCode(), GetSpotifyAppSecret())
                .sendFormData({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: callback_uri
                }).execute();
            let res = await req;
            if (res.status < 200 || res.status >= 300) {
                context.log.error(`Call to Spotify TOKEN Api failed with status ${res.status} and payload: ${JSON.stringify(res.body, undefined, 2)}`);
                return undefined;
            }
            if (!res.body || !res.body['access_token'] || !res.body['token_type'] || !res.body['scope'] || !res.body['expires_in'] || !res.body['refresh_token']) {
                context.log.error(`Call to Spotify TOKEN Api Successful but missing some items in response payload: ${JSON.stringify(res.body, undefined, 2)}`);
                return undefined;
            }
            return {
                AccessToken: String(res.body['access_token']),
                TokenValidUntil: new Date(Date.now() + (Number(res.body['expires_in']) * 1000)),
                Scopes: String(res.body['scope']),
                RefreshToken: String(res.body['refresh_token'])
            }
        } catch (e) {
            context.log.error(`Call to Spotify TOKEN Api failed with exception: `);
            context.log.error(e);
            return undefined;
        }
    }

    public static async AuthenticationRefreshFlow(refresh_token: string, context: Context): Promise<SpotifyRefreshCredentials> {
        context.log.info(`Spotify.AuthenticationRefreshFlow('${refresh_token}')`);
        throwIfMissingVariables(context);
        try {
            let req = httpPost('https://accounts.spotify.com/api/token')
                .authBasic(GetSpotifyAppCode(), GetSpotifyAppSecret())
                .sendFormData({
                    grant_type: 'refresh_token',
                    refresh_token: refresh_token
                }).execute();
            let res = await req;
            if (res.status < 200 || res.status >= 300) {
                context.log.error(`Call to Spotify TOKEN Api failed with status ${res.status} and payload: ${JSON.stringify(res.body, undefined, 2)}`);
                return undefined;
            }
            if (!res.body || !res.body['access_token'] || !res.body['token_type'] || !res.body['scope'] || !res.body['expires_in']) {
                context.log.error(`Call to Spotify TOKEN Api Successful but missing some items in response payload: ${JSON.stringify(res.body, undefined, 2)}`);
                return undefined;
            }
            return {
                AccessToken: String(res.body['access_token']),
                TokenValidUntil: new Date(Date.now() + (Number(res.body['expires_in']) * 1000)),
                Scopes: String(res.body['scope'])
            }
        } catch (e) {
            context.log.error(`Call to Spotify TOKEN Api failed with exception: `);
            context.log.error(e);
            return undefined;
        }
    }

    public static async AuthenticateWithClientCredentials(context: Context): Promise<SpotifyAppCredentials> {
        context.log.info(`Spotify.AuthenticateWithClientCredentials()`);
        throwIfMissingVariables(context);
        try {
            let req = httpPost('https://accounts.spotify.com/api/token')
                .authBasic(GetSpotifyAppCode(), GetSpotifyAppSecret())
                .sendFormData({
                    grant_type: 'client_credentials'
                }).execute();
            let res = await req;
            if (res.status < 200 || res.status >= 300) {
                context.log.error(`Call to Spotify TOKEN Api failed with status ${res.status} and payload: ${JSON.stringify(res.body, undefined, 2)}`);
                return undefined;
            }
            if (!res.body || !res.body['access_token'] || !res.body['token_type'] || !res.body['expires_in']) {
                context.log.error(`Call to Spotify TOKEN Api Successful but missing some items in response payload: ${JSON.stringify(res.body, undefined, 2)}`);
                return undefined;
            }
            return {
                AccessToken: String(res.body['access_token']),
                TokenValidUntil: new Date(Date.now() + (Number(res.body['expires_in']) * 1000))
            }
        } catch (e) {
            context.log.error(`Call to Spotify TOKEN Api failed with exception: `);
            context.log.error(e);
            return undefined;
        }
    }

    public static async GetCurrentTrack(player_token: string, country: string, context: Context): Promise<SpotifyCurrentTrack | undefined> {
        context.log.info(`Spotify.GetCurrentTrack('${player_token}', '${country}')`);
        try {
            let req = httpGet(`https://api.spotify.com/v1/me/player/currently-playing${(country) ? '?market=' + country : ''}`)
                .authBearer(player_token)
                .execute();
            let res = await req;
            if (res.status === 200) {
                if (res.body['currently_playing_type'] === 'track') {
                    return {
                        track_id: (res.body && res.body['item'] && res.body['item']['type'] === 'track' && res.body['item']['id']) ? res.body['item']['id'] : null,
                        is_playing: (res.body && res.body['is_playing']) ? res.body['is_playing'] : null,
                        progress_ms: (res.body && res.body['progress_ms']) ? res.body['progress_ms'] : null
                    };
                } else {
                    return undefined;
                }
            } else if (res.status === 204) {
                return undefined;
            } else {
                context.log.warn(`Spotify.GetCurrentTrack returned unexpected response: ${JSON.stringify(res, undefined, 2)}`);
                return undefined;
            }
        } catch (e) {
            context.log.error(`Spotify.GetCurrentTrack failed with exception: `);
            context.log.error(e);
            return undefined;
        }
    }

    public static async AddTrackToQueue(track_id: string, player_token: string, context: Context): Promise<boolean> {
        context.log.info(`Spotify.AddTrackToQueue('${track_id}', '${player_token}')`);
        try {
            let req = httpPost(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent('spotify:track:' + track_id)}`)
                .authBearer(player_token)
                .execute();
            let res = await req;
            if (res.status === 204) {
                return true;
            } else {
                context.log.warn(`Spotify.AddTrackToQueue returned unexpected response: ${JSON.stringify(res, undefined, 2)}`);
                return false;
            }
        } catch (e) {
            context.log.error(`Spotify.AddTrackToQueue failed with exception: `);
            context.log.error(e);
            return false;
        }
    }

    public static async GetUserProfile(player_token: string, context: Context): Promise<SpotifyUserProfile | undefined> {
        context.log.info(`Spotify.GetUserProfile('${player_token}')`);
        try {
            let req = httpGet('https://api.spotify.com/v1/me')
                .authBearer(player_token)
                .execute();
            let res = await req;
            if (res.status === 200) {
                return {
                    user_id: (res.body && res.body['id']) ? res.body['id'] : null,
                    display_name: (res.body && res.body['display_name']) ? res.body['display_name'] : null,
                    country: (res.body && res.body['country']) ? res.body['country'] : null,
                };
            } else {
                context.log.warn(`Spotify.GetUserProfile returned unexpected response: ${JSON.stringify(res, undefined, 2)}`);
                return undefined;
            }
        } catch (e) {
            context.log.error(`Spotify.GetUserProfile failed with exception: `);
            context.log.error(e);
            return undefined;
        }
    }

}