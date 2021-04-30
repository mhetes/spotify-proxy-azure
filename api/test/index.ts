import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { CreateApi, Response } from '../spotify-proxy/ApiController';
import { IAuthentication } from '../spotify-proxy/Security';

const doGet = async (context: Context, authentication: IAuthentication): Promise<Response> => {
    return {
        status: 200,
        body: {
            message: 'Successful GET occured!',
            envs: process.env
        }
    }
};

const doPost = async (context: Context, authentication: IAuthentication): Promise<Response> => {
    return {
        status: 200,
        body: {
            message: 'Successful POST occured!',
            payload: context.req.body
        }
    }
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log.info('SpotifyProxy HTTP trigger for Test started');
    context.log.info('HTTP Request: ' + JSON.stringify(req, undefined, 2));
    
    let testApi = CreateApi({ CorsEnabled: true, SecureApis: true })
        .OnGet(false, null, doGet)
        .OnPost(false, null, doPost)
        .Build();

    let response = await testApi.Execute(context);
    context.res = response;

};

export default httpTrigger;