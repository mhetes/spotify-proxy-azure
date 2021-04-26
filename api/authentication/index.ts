import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { CreateApi } from '../spotify-proxy/ApiController';
import { ERole } from '../spotify-proxy/Security';
import { Service } from '../spotify-proxy/Service';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log.info('SpotifyProxy HTTP trigger for Authentication started');
    context.log.info('HTTP Request: ' + JSON.stringify(req, undefined, 2));
    
    let authenticationApi = CreateApi({ CorsEnabled: true, SecureApis: true })
        .OnGet(true, [ERole.Player, ERole.Listener], Service.AuthenticationGet)
        .OnPost(false, null, Service.AuthenticationCreate)
        .OnDelete(true, [ERole.Player, ERole.Listener], Service.AuthenticationDelete)
        .Build();

    let response = await authenticationApi.Execute(context);
    context.res = response;
};

export default httpTrigger;