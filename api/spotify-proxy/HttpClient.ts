import * as httplib from 'http';
import * as httpslib from 'https';

interface IHttpResponse {
    status: number;
    headers: httplib.IncomingHttpHeaders;
    body: object;
}

class HttpRequest {

    private options: httplib.RequestOptions;
    private payload: Buffer;

    constructor(method: string, url: string) {
        let pUrl = new URL(url);
        if (pUrl.protocol === 'http:' || pUrl.protocol === 'https:') {
            this.options = {
                protocol: pUrl.protocol,
                hostname: pUrl.hostname,
                port: (pUrl.protocol === 'http:') ? ((!pUrl.port) ? 80 : pUrl.port) : ((!pUrl.port) ? 443 : pUrl.port),
                path: pUrl.pathname,
                method: method,
                timeout: 5000,
                headers: {
                    accept: 'application/json'
                }
            } as httplib.RequestOptions;
        } else {
            throw new Error(`HttpRequest.prepareOptions() - Invalid protocol specified: ${pUrl.protocol}`);
        }
    }

    public header(name: string, value: string): HttpRequest {
        this.options.headers[name.toLowerCase()] = value;
        return this;
    }

    public authBasic(username: string, password: string): HttpRequest {
        let authString = `${username}:${password}`;
        let authBase64 = Buffer.from(authString, 'utf8').toString('base64');
        return this.header('Authorization', `Basic ${authBase64}`);
    }

    public authBearer(token: string): HttpRequest {
        return this.header('Authorization', `Bearer ${token}`);
    }

    public sendJson(data: object): HttpRequest {
        if (['OPTIONS', 'GET', 'DELETE', 'HEAD'].includes(this.options.method)) {
            throw new Error(`Request method '${this.options.method}' cannot contain JSON payload`);
        }
        this.payload = Buffer.from(JSON.stringify(data), 'utf8');
        return this.header('Content-Type', 'application/json; charset=UTF-8')
            .header('Content-Length', this.payload.byteLength.toString());
    }

    public sendFormData(inputs: {[key: string]: string}): HttpRequest {
        if (['OPTIONS', 'GET', 'DELETE', 'HEAD'].includes(this.options.method)) {
            throw new Error(`Request method '${this.options.method}' cannot contain Form Data payload`);
        }
        let formData = '';
        Object.keys(inputs).forEach(name => {
            let data = inputs[name];
            if (data) {
                if (formData !== '') {
                    formData += '&';
                }
                formData += `${encodeURIComponent(name)}=${encodeURIComponent(data)}`;
            }
        });
        this.payload = Buffer.from(formData, 'utf8');
        return this.header('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
            .header('Content-Length', this.payload.byteLength.toString());
    }

    public execute(): Promise<IHttpResponse> {
        return new Promise<IHttpResponse>((resolve) => {
            let http = (this.options.protocol === 'http:') ? httplib : httpslib;
            let req = http.request(this.options, (res) => {
                let resData = [] as Uint8Array[];
                res.on('data', (chunk) => { resData.push(chunk); });
                res.on('end', () => {
                    let resBody = undefined as object | undefined;
                    try {
                        resBody = JSON.parse(Buffer.concat(resData).toString('utf8'));
                    } catch (e) {
                        resBody = undefined;
                    }
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: resBody
                    });
                });
            });
            req.on('error', (err) => {
                let errObject = {};
                Object.getOwnPropertyNames(err).forEach((prop) => { errObject[prop] = err[prop]; });
                resolve({
                    status: -1,
                    headers: {},
                    body: errObject
                });
            });
            if (['POST', 'PUT'].includes(this.options.method) && this.payload !== undefined) {
                req.write(this.payload);
            }
            req.end();
        });
    }

}

export function httpGet(url: string) {
    return new HttpRequest('GET', url);
}

export function httpPost(url: string) {
    return new HttpRequest('POST', url);
}

export function httpPut(url: string) {
    return new HttpRequest('PUT', url);
}

export function httpDelete(url: string) {
    return new HttpRequest('DELETE', url);
}