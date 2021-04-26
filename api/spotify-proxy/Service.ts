import { Context } from '@azure/functions';
import { Response, ErrorMessage } from './ApiController';
import { ERole, IAuthentication } from './Security';

interface TrackInfo {
    trackId: string;
}

export class Service {

    public static async AuthenticationCreate(context: Context, authentication: IAuthentication): Promise<Response> {
        context.log.info(`Service.AuthenticationCreate()`);
        // Verify Payload

        // Spotify Code Flow Authentication

        // Player Create

        // Response

        // OOOR

        // Spotify Client Credentials Flow

        // Retrieve Player

        // Listener Create

        // Response
        return { status: 200, body: undefined };
    }

    public static async AuthenticationGet(context: Context, authentication: IAuthentication): Promise<Response> {
        context.log.info(`Service.AuthenticationGet()`);
        return { status: 200, body: undefined };
    }

    public static async AuthenticationDelete(context: Context, authentication: IAuthentication): Promise<Response> {
        context.log.info(`Service.AuthenticationDelete()`);
        return { status: 200, body: undefined };
    }

    public static async SpotifyGetCurrentTrack(context: Context, authentication: IAuthentication): Promise<Response> {
        context.log.info(`Service.SpotifyGetCurrentTrack()`);
        return { status: 200, body: undefined };
    }

    public static async SpotifyAddTrackToQueue(context: Context, authentication: IAuthentication): Promise<Response> {
        context.log.info(`Service.SpotifyAddTrackToQueue()`);
        return { status: 200, body: undefined };
    }

    private errorRes(status: number, errorMessage: string, context: Context): Response {
        let message = {
            ErrorMessage: errorMessage,
            InvocationId: (context && context.invocationId) ? context.invocationId : 'unknown'
        } as ErrorMessage;
        return {
            status: status,
            body: message
        }
    }

}
