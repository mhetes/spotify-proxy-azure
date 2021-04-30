import { Context, Cookie } from '@azure/functions';
import { GetAllowedOrigins } from './EnvironmentVariables';
import { ERole, IAuthentication, Security } from './Security';

export interface Response {
    status: number;
    body: any;
}

export type ServiceHandler = (context: Context, authentication: IAuthentication) => Promise<Response>;

interface IApiOptions {
    CorsEnabled?: boolean;
    SecureApis?: boolean;
}

interface IApiRoute {
    AuthenticationRequired: boolean;
    AllowedRoles: ERole[] | null;
    Handler: ServiceHandler
}

interface IApiRoutes extends IApiOptions {
    CorsEnabled: boolean;
    SecureApis: boolean;
    GetRoute: IApiRoute | null;
    PostRoute: IApiRoute | null;
    PutRoute: IApiRoute | null;
    DeleteRoute: IApiRoute | null;
}

interface HttpResponse {
    status: number;
    body: any;
    isRaw?: boolean;
    headers?: {[name: string]: string | undefined};
    cookies?: Cookie[]
}

export interface ErrorMessage {
    ErrorMessage: string;
    InvocationId: string;
}

class ApiController {

    private routes: IApiRoutes;
    private corsHeaders: string[];

    constructor(routes: IApiRoutes) {
        this.routes = routes;
        this.corsHeaders = ['Origin', 'X-Requested-With', 'Content-Type', 'Content-Length', 'Accept', 'Authorization'];
    }

    public async Execute(context: Context): Promise<HttpResponse> {
        context.log.info(`ApiController.Execute()`);
        let initTimestamp = Date.now();
        let response = {
            status: 0,
            body: undefined,
            headers: {}
        } as HttpResponse;
        try {
            // Check if Http Request exists
            if (!context || !context.req) {
                return this.errorResponse(500, 'HttpRequest Binding not found!', context, response);
            }
            // Add Secure Headers
            if (this.routes.SecureApis) {
                // Cache
                response.headers['Surrogate-Control'] = 'no-store';
                response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate';
                response.headers['Pragma'] = 'no-cache';
                response.headers['Expires'] = new Date().toUTCString();
                // Security
                response.headers['Content-Security-Policy'] = `default-src 'self'; img-src *; media-src *; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.spotify.com; style-src 'self' 'unsafe-inline'`;
                response.headers['Expect-CT'] = 'max-age=0';
                response.headers['Referrer-Policy'] = 'no-referrer';
                response.headers['Strict-Transport-Security'] = 'max-age=31536000';
                response.headers['X-Content-Type-Options'] = 'nosniff';
                response.headers['X-DNS-Prefetch-Control'] = 'off';
                response.headers['X-Download-Options'] = 'noopen';
                response.headers['X-Frame-Options'] = 'DENY';
                response.headers['X-Permitted-Cross-Domain-Policies'] = 'none';
                response.headers['X-XSS-Protection'] = '1; mode=block';
            }
            // Add CORS Headers
            if (this.routes.CorsEnabled) {
                let [origin, addVary, originMatch] = this.checkOrigin(context);
                response.headers['Access-Control-Allow-Credentials'] = 'false';
                response.headers['Access-Control-Allow-Origin'] = origin;
                response.headers['Access-Control-Allow-Methods'] = this.getAllowedMethods();
                response.headers['Access-Control-Allow-Headers'] = this.corsHeaders.join(', ');
                response.headers['Access-Control-Max-Age'] = '60';
                if (addVary) {
                    response.headers['Vary'] = 'Origin';
                }
                if (!originMatch) {
                    if (context.req.method === 'OPTIONS') {
                        return this.finalizeResponse(403, undefined, response);
                    } else {
                        return this.errorResponse(403, 'CORS Origin check failed!', context, response);
                    }
                }
            }
            // OPTIONS Request + CORS check
            if (context.req.method === 'OPTIONS') {
                if (this.routes.CorsEnabled) {
                    let reqMethod = this.getHeader('Access-Control-Request-Method', context);
                    let reqHeadersStr = this.getHeader('Access-Control-Request-Headers', context);
                    if (!reqMethod || !reqHeadersStr) {
                        return this.finalizeResponse(400, undefined, response);
                    }
                    let allowedMethods = [] as string[];
                    if (this.routes.GetRoute) { allowedMethods.push('GET'); allowedMethods.push('HEAD'); }
                    if (this.routes.PostRoute) { allowedMethods.push('POST'); }
                    if (this.routes.PutRoute) { allowedMethods.push('PUT'); }
                    if (this.routes.DeleteRoute) { allowedMethods.push('DELETE'); }
                    if (!allowedMethods.includes(reqMethod.toUpperCase())) {
                        return this.finalizeResponse(403, undefined, response);
                    }
                    let allowedHeaders = [] as string[];
                    this.corsHeaders.forEach(ch => { allowedHeaders.push(ch.toUpperCase()); });
                    let requiredHeaders = [] as string[];
                    reqHeadersStr.split(',').forEach(rh => { requiredHeaders.push(rh.trim().toUpperCase()); });
                    for (let i = 0; i < requiredHeaders.length; i++) {
                        if (!allowedHeaders.includes(requiredHeaders[i])) {
                            return this.finalizeResponse(403, undefined, response);
                        }
                    }
                }
                return this.finalizeResponse(204, undefined, response);
            }
            // Get Route to execute
            let route = null as IApiRoute | null;
            let onlyHead = false;
            switch(context.req.method) {
                case 'GET': route = this.routes.GetRoute; break;
                case 'HEAD': route = this.routes.GetRoute; onlyHead = true; break;
                case 'POST': route = this.routes.PostRoute; break;
                case 'PUT': route = this.routes.PutRoute; break;
                case 'DELETE': route = this.routes.DeleteRoute; break;
                default: route = null;
            }
            if (route === null) {
                return this.errorResponse(405, `Method '${context.req.method}' Not Allowed!`, context, response);
            }
            // Authentication Check
            let authentication = {
                Role: 'Unauthenticated',
                PlayerId: context.invocationId,
                ListenerId: context.invocationId
            } as IAuthentication;
            if (route.AuthenticationRequired) {
                let authHeader = this.getHeader('Authorization', context);
                if (!authHeader) {
                    return this.errorResponse(401, `Server required authentication for this request!`, context, response);
                }
                if (authHeader.toUpperCase().substr(0, 7) !== 'BEARER ') {
                    return this.errorResponse(401, `Server required authentication for this request!`, context, response);
                }
                let bearer = authHeader.substr(7);
                authentication = Security.VerifyAuthentication(bearer, context);
                if (!authentication || !authentication.Role || !authentication.PlayerId || authentication.Role === 'Unauthenticated' || (authentication.Role === ERole.Listener && !authentication.ListenerId)) {
                    return {
                        status: 401,
                        body: authentication
                    }
                    // return this.errorResponse(401, `Server required authentication for this request!`, context, response);
                }
            }
            // Roles check
            if (route.AuthenticationRequired && Array.isArray(route.AllowedRoles) && route.AllowedRoles.length > 0) {
                if (!route.AllowedRoles.includes(authentication.Role as ERole)) {
                    return this.errorResponse(403, `Invalid permissions for accessing this resource!`, context, response);
                }
            }
            // Execute Handler
            let handlerTimestamp = Date.now();
            let handlerRes = await route.Handler(context, authentication);
            let finalTimestap = Date.now();
            let totalMs = finalTimestap - initTimestamp;
            let handlerMs = finalTimestap - handlerTimestamp;
            context.log.info(`Handler execution: ${handlerMs} ms, Total execution: ${totalMs} ms`);
            return this.finalizeResponse(handlerRes.status, handlerRes.body, response, onlyHead);
        } catch (e) {
            context.log.error(`Controller Execution failed with exception: `);
            context.log.error(e);
            return this.errorResponse(500, `Server encountered internal error!`, context, response);
        }
    }

    private finalizeResponse(status: number, data: object | undefined, response: HttpResponse, onlyHead?: boolean): HttpResponse {
        response.status = status;
        let stringified = JSON.stringify(data);
        if (stringified !== undefined) {
            let buffer = Buffer.from(stringified);
            if (onlyHead === true) {
                response.body = undefined;
            } else {
                response.body = buffer;
            }
            response.headers['Content-Type'] = 'application/json; charset=UTF-8';
            response.headers['Content-Length'] = buffer.byteLength.toString();
        } else {
            response.body = undefined;
            response.headers['Content-Length'] = '0';
        }
        return response;
    }

    private errorResponse(status: number, errorMessage: string, context: Context, response: HttpResponse): HttpResponse {
        let message = {
            ErrorMessage: errorMessage,
            InvocationId: (context && context.invocationId) ? context.invocationId : 'unknown'
        } as ErrorMessage;
        return this.finalizeResponse(status, message, response);
    }

    private getHeader(name: string, context: Context): string | undefined {
        let lname = name.toLowerCase();
        if (!context.req.headers) {
            return undefined;
        }
        let headers = Object.keys(context.req.headers);
        for (let i = 0; i < headers.length; i++) {
            let header = headers[i];
            if (header.toLowerCase() === lname) {
                return context.req.headers[header].trim();
            }
        }
        return undefined;
    }

    private checkOrigin(context: Context): [string, boolean, boolean] {
        let allowedOriginsStr = GetAllowedOrigins();
        let allowedOriginsSpecified = false;
        let allowedOrigins = [] as string[];
        if (allowedOriginsStr) {
            allowedOriginsSpecified = true;
            let allowedOriginsSplit = allowedOriginsStr.split(',');
            allowedOriginsSplit.forEach(origin => { allowedOrigins.push(origin.trim().toLowerCase()); });
        }
        if (allowedOriginsSpecified && allowedOrigins.length > 0) {
            let reqCorsOrigin = this.getHeader('Origin', context);
            if (reqCorsOrigin) {
                let origin = reqCorsOrigin.trim().toLowerCase();
                if (allowedOrigins.includes(origin)) {
                    return [reqCorsOrigin, true, true];
                } else {
                    return [allowedOrigins[0], true, false];
                }
            } else {
                return [allowedOrigins[0], true, true];
            }
        } else {
            return ['*', false, true];
        }
    }

    private getAllowedMethods(): string {
        const addMethod = (currentMethods: string, newMethod: string): string => {
            let newMethods = currentMethods;
            if (newMethods !== '') {
                newMethods += ', ';
            }
            newMethods += newMethod;
            return newMethods;
        };
        let allowedMethods = '';
        if (this.routes.GetRoute) {
            allowedMethods = addMethod(allowedMethods, 'GET');
            allowedMethods = addMethod(allowedMethods, 'HEAD');
        }
        if (this.routes.PostRoute) {
            allowedMethods = addMethod(allowedMethods, 'POST');
        }
        if (this.routes.PutRoute) {
            allowedMethods = addMethod(allowedMethods, 'PUT');
        }
        if (this.routes.DeleteRoute) {
            allowedMethods = addMethod(allowedMethods, 'DELETE');
        }
        allowedMethods = addMethod(allowedMethods, 'OPTIONS');
        return allowedMethods;
    }
}

class ApiBuilder {

    private routes: IApiRoutes;

    constructor(options?: IApiOptions) {
        this.routes = {
            CorsEnabled: (options === undefined || options.CorsEnabled === undefined || typeof options.CorsEnabled !== 'boolean') ? true : options.CorsEnabled,
            SecureApis: (options === undefined || options.SecureApis === undefined || typeof options.SecureApis !== 'boolean') ? true : options.SecureApis,
            GetRoute: null,
            PostRoute: null,
            PutRoute: null,
            DeleteRoute: null
        }
    }

    public OnGet(authenticationRequired: boolean, allowedRoles: ERole | ERole[] | null, handler: ServiceHandler): ApiBuilder {
        this.routes.GetRoute = {
            AuthenticationRequired: authenticationRequired,
            AllowedRoles: this.prepareAllowedRoles(authenticationRequired, allowedRoles),
            Handler: handler
        }
        return this;
    }

    public OnPost(authenticationRequired: boolean, allowedRoles: ERole | ERole[] | null, handler: ServiceHandler): ApiBuilder {
        this.routes.PostRoute = {
            AuthenticationRequired: authenticationRequired,
            AllowedRoles: this.prepareAllowedRoles(authenticationRequired, allowedRoles),
            Handler: handler
        }
        return this;
    }

    public OnPut(authenticationRequired: boolean, allowedRoles: ERole | ERole[] | null, handler: ServiceHandler): ApiBuilder {
        this.routes.PutRoute = {
            AuthenticationRequired: authenticationRequired,
            AllowedRoles: this.prepareAllowedRoles(authenticationRequired, allowedRoles),
            Handler: handler
        }
        return this;
    }

    public OnDelete(authenticationRequired: boolean, allowedRoles: ERole | ERole[] | null, handler: ServiceHandler): ApiBuilder {
        this.routes.DeleteRoute = {
            AuthenticationRequired: authenticationRequired,
            AllowedRoles: this.prepareAllowedRoles(authenticationRequired, allowedRoles),
            Handler: handler
        }
        return this;
    }

    public Build(): ApiController {
        return new ApiController(this.routes);
    }

    private prepareAllowedRoles(authenticationRequired: boolean, allowedRoles: ERole | ERole[] | null): ERole[] | null {
        if (!authenticationRequired) {
            return null;
        } else {
            if (!allowedRoles) {
                return null;
            } else {
                if (Array.isArray(allowedRoles)) {
                    return allowedRoles;
                } else {
                    return [allowedRoles];
                }
            }
        }
    }
}

export function CreateApi(options?: IApiOptions): ApiBuilder {
    return new ApiBuilder(options);
}
