import { Context } from '@azure/functions';
import { GetSpotifyAppCode, GetSpotifyAppSecret, GetSpotifyAppCallback } from './EnvironmentVariables';
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
    if (!GetSpotifyAppCallback()) {
        doThrow = true;
        context.log.error(`Missing Environment variable for: SpotifyAppCallback`);
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

export class Spotify {

    public static async AuthenticateWithCodeFlow(code: string, context: Context): Promise<SpotifyUserCredentials> {
        context.log.info(`Spotify.AuthenticateWithCodeFlow('${code}')`);
        throwIfMissingVariables(context);
        let req = httpPost('https://accounts.spotify.com/api/token')
            .authBasic(GetSpotifyAppCode(), GetSpotifyAppSecret())
            .sendFormData({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: GetSpotifyAppCallback()
            }).execute();
        try {
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
        let req = httpPost('https://accounts.spotify.com/api/token')
            .authBasic(GetSpotifyAppCode(), GetSpotifyAppSecret())
            .sendFormData({
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            }).execute();
        try {
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
        let req = httpPost('https://accounts.spotify.com/api/token')
            .authBasic(GetSpotifyAppCode(), GetSpotifyAppSecret())
            .sendFormData({
                grant_type: 'client_credentials'
            }).execute();
        try {
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

    public static async GetCurrentTrack(player_token: string, context: Context): Promise<void> {
        context.log.info(`Spotify.GetCurrentTrack('${player_token}')`);
    }

    public static async AddTrackToQueue(track_uri: string, player_token: string, context: Context): Promise<void> {
        context.log.info(`Spotify.AddTrackToQueue('${track_uri}', '${player_token}')`);
    }

    public static async GetUserProfile(player_token: string, context: Context): Promise<void> {
        context.log.info(`Spotify.GetUserProfile('${player_token}')`);
    }


}