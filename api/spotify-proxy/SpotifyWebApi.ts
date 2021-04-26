import { Context } from '@azure/functions';


export class SpotifyWebApi {

    public static async AuthenticateWithCodeFlow(code: string, scopes: string, context: Context): Promise<void> {

    }

    public static async AuthenticationRefreshFlow(refresh_token: string, context: Context): Promise<void> {

    }

    public static async AuthenticateWithClientCredentials(scopes: string, context: Context): Promise<void> {

    }

    public static async GetCurrentTrack(player_token: string, context: Context): Promise<void> {

    }

    public static async AddTrackToQueue(track_uri: string, player_token: string, context: Context): Promise<void> {

    }

    public static async GetUserProfile(player_token: string, context: Context): Promise<void> {

    }


}