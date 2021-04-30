import { Context } from '@azure/functions';
import { Response, ErrorMessage } from './ApiController';
import { ERole, IAuthentication, Security } from './Security';
import { Spotify } from './Spotify';
import { DbPlayer, DbListener, Cosmos } from './Cosmos';
import { GetSpotifyAppCallbacks } from './EnvironmentVariables'

interface AuthenticationRequest {
    type: ERole;
    code: string;
    callback_or_player_id?: string;
}

interface AuthenticationResponse {
    bearer_token: string;
    spotify_token: string;
    spotify_expire: Date;
    spotify_country: string;
    spotify_user_id: string;
    spotify_user_name: string;
    player_id?: string;
    player_code?: string;
}

interface TrackRequest {
    track_id: string;
}

interface TrackResponse {
    user_id: string;
    user_name: string;
    track_id: string | null;
    is_playing: boolean | null;
    progress_ms: number | null;
}

export class Service {

    public static async AuthenticationCreate(context: Context, authentication: IAuthentication): Promise<Response> {
        context.log.info(`Service.AuthenticationCreate()`);
        if (!context.req.body) {
            context.log.warn(`No Authentication payload found!`);
            return errorRes(400, 'No Authentication payload found!', context);
        }
        let req = context.req.body as AuthenticationRequest;
        if (!req.code || typeof req.code !== 'string') {
            context.log.warn(`Invalid authentication code specified!`);
            return errorRes(400, 'Invalid authentication code specified!', context);
        }
        if (!req.callback_or_player_id || typeof req.callback_or_player_id !== 'string') {
            context.log.warn(`Invalid authentication callback or player_uri specified!`);
            return errorRes(400, 'Invalid authentication callback or player_uri specified!', context);
        }
        if (req.type === ERole.Player) {
            let allCallbacks = GetSpotifyAppCallbacks();
            if (!allCallbacks) {
                context.log.warn(`Failed to verify authentication!`);
                return errorRes(500, 'Failed to verify authentication!', context);
            }
            let callbacksArr = allCallbacks.split(',');
            if (!callbacksArr.includes(req.callback_or_player_id)) {
                context.log.warn(`Invalid callback URI specified!`);
                return errorRes(400, 'Invalid callback URI specified!', context);
            }
            let spotifyAuth = await Spotify.AuthenticateWithCodeFlow(req.code, req.callback_or_player_id, context);
            if (!spotifyAuth) {
                context.log.warn(`Spotify Authentication failed!`);
                return errorRes(502, 'Spotify Authentication failed!', context);
            }
            context.log.info(`Spotify Code Flow Authentication successful!`);
            let spotifyUser = await Spotify.GetUserProfile(spotifyAuth.AccessToken, context);
            if (!spotifyUser) {
                context.log.warn(`Spotify User Authentication failed!`);
                return errorRes(502, 'Spotify User Authentication failed!', context);
            }
            context.log.info(`Spotify obtaining User Profile successful! Profile: ${JSON.stringify(spotifyUser, undefined, 2)}`);
            let player_data = {
                record: 'Player',
                spotify_token: spotifyAuth.AccessToken,
                spotify_expire: spotifyAuth.TokenValidUntil,
                spotify_refresh: spotifyAuth.RefreshToken,
                spotify_country: spotifyUser.country,
                spotify_user_id: spotifyUser.user_id,
                spotify_user_name: spotifyUser.display_name,
                player_code: Security.RandomString(50)
            } as DbPlayer;
            let created_player = await Cosmos.CreatePlayer(player_data, context);
            if (!created_player) {
                context.log.warn(`Create Player failed!`);
                return errorRes(500, 'Create Player failed!', context);
            }
            context.log.info(`Successfully created new Player with Id '${created_player.id}' for Spotify User '${created_player.spotify_user_id}'`);
            let player_bearer = Security.CreateAuthentication(ERole.Player, created_player.id, undefined, context);
            if (!player_bearer) {
                context.log.warn(`Failed to Create Player Authentication!`);
                return errorRes(500, 'Failed to Create Player Authentication!', context);
            }
            return {
                status: 200,
                body: {
                    bearer_token: player_bearer,
                    spotify_token: created_player.spotify_token,
                    spotify_expire: created_player.spotify_expire,
                    spotify_country: created_player.spotify_country,
                    spotify_user_id: created_player.spotify_user_id,
                    spotify_user_name: created_player.spotify_user_name,
                    player_id: created_player.id,
                    player_code: created_player.player_code
                } as AuthenticationResponse
            };
        } else if (req.type === ERole.Listener) {
            let [found_player, spotify_credentials] = await Promise.all([Cosmos.GetPlayer(req.callback_or_player_id, context), Spotify.AuthenticateWithClientCredentials(context)]);
            if (!found_player) {
                context.log.warn(`Player Not Found!`);
                return errorRes(400, 'Player Not Found!', context);
            }
            if (found_player.player_code !== req.code) {
                context.log.warn(`Invalid Player Authentication Code!`);
                return errorRes(400, 'Invalid Player Authentication Code!', context);
            }
            if (!spotify_credentials) {
                context.log.warn(`Spotify Client Authentication failed!`);
                return errorRes(502, 'Spotify Client Authentication failed!', context);
            }
            let listener_data = {
                record: 'Listener',
                player_id: req.callback_or_player_id,
                spotify_token: spotify_credentials.AccessToken,
                spotify_expire: spotify_credentials.TokenValidUntil
            } as DbListener;
            let created_listener = await Cosmos.CreateListener(listener_data, context);
            if (!created_listener) {
                context.log.warn(`Create Listener failed!`);
                return errorRes(500, 'Create Listener failed!', context);
            }
            let listener_bearer = Security.CreateAuthentication(ERole.Listener, req.callback_or_player_id, created_listener.id, context);
            if (!listener_bearer) {
                context.log.warn(`Failed to Create Listener Authentication!`);
                return errorRes(500, 'Failed to Create Listener Authentication!', context);
            }
            return {
                status: 200,
                body: {
                    bearer_token: listener_bearer,
                    spotify_token: created_listener.spotify_token,
                    spotify_expire: created_listener.spotify_expire,
                    spotify_country: found_player.spotify_country,
                    spotify_user_id: found_player.spotify_user_id,
                    spotify_user_name: found_player.spotify_user_name,
                } as AuthenticationResponse
            };
        } else {
            context.log.warn(`Invalid Authentication Type specified: ${req.type}`);
            return errorRes(400, `Invalid Authentication Type specified: ${req.type}`, context);
        }
    }

    public static async AuthenticationGet(context: Context, authentication: IAuthentication): Promise<Response> {
        context.log.info(`Service.AuthenticationGet()`);
        if (authentication.Role === ERole.Player) {
            let found_player = await Cosmos.GetPlayer(authentication.PlayerId, context);
            if (!found_player) {
                context.log.warn(`Player no longer exists!`);
                return errorRes(404, 'Player no longer exists!', context);
            }
            if (new Date(Date.now() + 600000) > found_player.spotify_expire) {
                let refreshed_credentials = await Spotify.AuthenticationRefreshFlow(found_player.spotify_refresh, context);
                if (!refreshed_credentials) {
                    context.log.warn(`Spotify ReAuthentication failed!`);
                    return errorRes(502, 'Spotify ReAuthentication failed!', context);
                }
                found_player.spotify_token = refreshed_credentials.AccessToken;
                found_player.spotify_expire = refreshed_credentials.TokenValidUntil;
                found_player = await Cosmos.UpdatePlayer(found_player, context);
                if (!found_player) {
                    context.log.warn(`Player Update failed!`);
                    return errorRes(500, 'Player Update failed!', context);
                }
            }
            return {
                status: 200,
                body: {
                    bearer_token: authentication.Bearer,
                    spotify_token: found_player.spotify_token,
                    spotify_expire: found_player.spotify_expire,
                    spotify_country: found_player.spotify_country,
                    spotify_user_id: found_player.spotify_user_id,
                    spotify_user_name: found_player.spotify_user_name,
                    player_id: found_player.id,
                    player_code: found_player.player_code
                } as AuthenticationResponse
            };
        } else if (authentication.Role === ERole.Listener) {
            let [found_player, found_listener] = await Promise.all([Cosmos.GetPlayer(authentication.PlayerId, context), Cosmos.GetListener(authentication.ListenerId, context)]);
            if (!found_player || !found_listener) {
                context.log.warn(`Listener or Player no longer exists!`);
                return errorRes(404, 'Listener or Player no longer exists!', context);
            }
            if (new Date(Date.now() + 600000) > found_listener.spotify_expire) {
                let client_credentials = await Spotify.AuthenticateWithClientCredentials(context);
                if (!client_credentials) {
                    context.log.warn(`Spotify Client ReAuthentication failed!`);
                    return errorRes(502, 'Spotify Client ReAuthentication failed!', context);
                }
                found_listener.spotify_token = client_credentials.AccessToken;
                found_listener.spotify_expire = client_credentials.TokenValidUntil;
                found_listener = await Cosmos.UpdateListener(found_listener, context);
                if (!found_listener) {
                    context.log.warn(`Listener Update failed!`);
                    return errorRes(500, 'Listener Update failed!', context);
                }
            }
            return {
                status: 200,
                body: {
                    bearer_token: authentication.Bearer,
                    spotify_token: found_listener.spotify_token,
                    spotify_expire: found_listener.spotify_expire,
                    spotify_user_id: found_player.spotify_user_id,
                    spotify_user_name: found_player.spotify_user_name,
                    spotify_country: found_player.spotify_country
                } as AuthenticationResponse
            };
        } else {
            context.log.warn(`Invalid Authentication Role: ${authentication.Role}`);
            return errorRes(400, `Invalid Authentication Role: ${authentication.Role}`, context);
        }
    }

    public static async AuthenticationDelete(context: Context, authentication: IAuthentication): Promise<Response> {
        context.log.info(`Service.AuthenticationDelete()`);
        if (authentication.Role === ERole.Player) {
            await Promise.all([Cosmos.DeletePlayer(authentication.PlayerId, context), Cosmos.PurgePlayerListeners(authentication.PlayerId, context)]);
            return {
                status: 204,
                body: undefined
            }
        } else if (authentication.Role === ERole.Listener) {
            await Cosmos.DeleteListener(authentication.ListenerId, context);
            return {
                status: 204,
                body: undefined
            }
        } else {
            context.log.warn(`Invalid Authentication Role: ${authentication.Role}`);
            return errorRes(400, `Invalid Authentication Role: ${authentication.Role}`, context);
        }
    }

    public static async SpotifyGetCurrentTrack(context: Context, authentication: IAuthentication): Promise<Response> {
        context.log.info(`Service.SpotifyGetCurrentTrack()`);
        let [found_player, found_listener] = await Promise.all([
            Cosmos.GetPlayer(authentication.PlayerId, context),
            (authentication.Role === ERole.Player) ? Promise.resolve(null) : Cosmos.GetListener(authentication.ListenerId, context)
        ]);
        if (!found_player || (authentication.Role === ERole.Listener && !found_listener)) {
            context.log.warn(`Listener or Player no longer exists!`);
            return errorRes(401, 'Listener or Player no longer exists!', context);
        }
        if (new Date(Date.now() + 600000) > found_player.spotify_expire) {
            let refreshed_credentials = await Spotify.AuthenticationRefreshFlow(found_player.spotify_refresh, context);
            if (!refreshed_credentials) {
                context.log.warn(`Spotify ReAuthentication failed!`);
                return errorRes(502, 'Spotify ReAuthentication failed!', context);
            }
            found_player.spotify_token = refreshed_credentials.AccessToken;
            found_player.spotify_expire = refreshed_credentials.TokenValidUntil;
            found_player = await Cosmos.UpdatePlayer(found_player, context);
            if (!found_player) {
                context.log.warn(`Player Update failed!`);
                return errorRes(500, 'Player Update failed!', context);
            }
        }
        let playing = await Spotify.GetCurrentTrack(found_player.spotify_token, found_player.spotify_country, context);
        if (!playing) {
            return {
                status: 200,
                body: {
                    user_id: found_player.spotify_user_id,
                    user_name: found_player.spotify_user_name,
                    track_id: null,
                    is_playing: null,
                    progress_ms: null
                } as TrackResponse
            };
        } else {
            return {
                status: 200,
                body: {
                    user_id: found_player.spotify_user_id,
                    user_name: found_player.spotify_user_name,
                    track_id: playing.track_id,
                    is_playing: playing.is_playing,
                    progress_ms: playing.progress_ms
                } as TrackResponse
            };
        }
    }

    public static async SpotifyAddTrackToQueue(context: Context, authentication: IAuthentication): Promise<Response> {
        context.log.info(`Service.SpotifyAddTrackToQueue()`);
        if (!context.req.body) {
            context.log.warn(`No Track payload found!`);
            return errorRes(400, 'No Track payload found!', context);
        }
        let req = context.req.body as TrackRequest;
        if (!req.track_id) {
            context.log.warn(`No Track specifid in payload!`);
            return errorRes(400, 'No Track specifid in payload!', context);
        }
        let [found_player, found_listener] = await Promise.all([Cosmos.GetPlayer(authentication.PlayerId, context), Cosmos.GetListener(authentication.ListenerId, context)]);
        if (!found_player || !found_listener) {
            context.log.warn(`Listener or Player no longer exists!`);
            return errorRes(401, 'Listener or Player no longer exists!', context);
        }
        if (new Date(Date.now() + 600000) > found_player.spotify_expire) {
            let refreshed_credentials = await Spotify.AuthenticationRefreshFlow(found_player.spotify_refresh, context);
            if (!refreshed_credentials) {
                context.log.warn(`Spotify ReAuthentication failed!`);
                return errorRes(502, 'Spotify ReAuthentication failed!', context);
            }
            found_player.spotify_token = refreshed_credentials.AccessToken;
            found_player.spotify_expire = refreshed_credentials.TokenValidUntil;
            found_player = await Cosmos.UpdatePlayer(found_player, context);
            if (!found_player) {
                context.log.warn(`Player Update failed!`);
                return errorRes(500, 'Player Update failed!', context);
            }
        }
        let result = await Spotify.AddTrackToQueue(req.track_id, found_player.spotify_token, context);
        if (!result) {
            return errorRes(403, 'Failed to add specified track to Queue', context);
        } else {
            return {
                status: 204,
                body: undefined
            }
        }
    }
}

function errorRes(status: number, errorMessage: string, context: Context): Response {
    let message = {
        ErrorMessage: errorMessage,
        InvocationId: (context && context.invocationId) ? context.invocationId : 'unknown'
    } as ErrorMessage;
    return {
        status: status,
        body: message
    }
}
