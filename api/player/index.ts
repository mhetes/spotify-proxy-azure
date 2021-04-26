import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { CreateApi } from '../spotify-proxy/ApiController';
import { ERole } from '../spotify-proxy/Security';
import { Service } from '../spotify-proxy/Service';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log.info('SpotifyProxy HTTP trigger for Player started');
    context.log.info('HTTP Request: ' + JSON.stringify(req, undefined, 2));
    
    let playerApi = CreateApi({ CorsEnabled: true, SecureApis: true })
        .OnGet(true, ERole.Listener, Service.SpotifyGetCurrentTrack)
        .OnPost(true, ERole.Listener, Service.SpotifyAddTrackToQueue)
        .Build();

    let response = await playerApi.Execute(context);
    context.res = response;
};

export default httpTrigger;