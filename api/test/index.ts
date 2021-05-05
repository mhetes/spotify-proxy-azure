import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { CreateApi, Response } from '../spotify-proxy/ApiController';
import { IAuthentication } from '../spotify-proxy/Security';

import { sign, verify } from 'jsonwebtoken';
import { ERole } from '../spotify-proxy/Security';
import * as crypto from 'crypto';

const tmpSecret = 'shhhhhhhhhvnslfhss84g3s8g423s8g423dsv4';

function padString(input: string): string {
    let segmentLength = 4;
    let stringLength = input.length;
    let diff = stringLength % segmentLength;

    if (!diff) {
        return input;
    }

    let position = stringLength;
    let padLength = segmentLength - diff;
    let paddedStringLength = stringLength + padLength;
    let buffer = Buffer.alloc(paddedStringLength);

    buffer.write(input);

    while (padLength--) {
        buffer.write("=", position++);
    }

    return buffer.toString();
}

const base64tobase64url = (b64: string): string => {
    return b64.toString().replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

const base64urltobase64 = (b64u: string): string => {
    return padString(b64u.toString()).replace(/-/g, "+").replace(/_/g, "/")
};

const mySign = (payload: object): string => {
    let header = {
        alg: 'HS256',
        typ: 'JWT'
    };
    payload['iat'] = Math.floor(Date.now() / 1000);
    let headerB64 = base64tobase64url(Buffer.from(JSON.stringify(header)).toString('base64'));
    let payloadB64 = base64tobase64url(Buffer.from(JSON.stringify(payload)).toString('base64'));
    let toSign = headerB64 + '.' + payloadB64;
    let signature = base64tobase64url(crypto.createHmac('sha256', tmpSecret).update(toSign).digest('base64'));
    return toSign + '.' + signature;
}

const myVerify = (token: string): object => {
    let parts = token.split('.');
    let header = JSON.parse(Buffer.from(base64urltobase64(parts[0]), 'base64').toString('utf8'));
    if (!header || !header.alg || header.alg !== 'HS256' || !header.typ || header.typ !== 'JWT') {
        throw Error('Invalid header');
    }
    let payload = JSON.parse(Buffer.from(base64urltobase64(parts[1]), 'base64').toString('utf8'));
    let toVerify = parts[0] + '.' + parts[1];
    let signature = base64tobase64url(crypto.createHmac('sha256', tmpSecret).update(toVerify).digest('base64'));
    if (signature !== parts[2]) {
        throw Error('Invalid signature');
    }
    return payload;
};

const doGet = async (context: Context, authentication: IAuthentication): Promise<Response> => {

    let signObj = { role: ERole.Listener, player: 'fafa122e-adde-11eb-8529-0242ac130003', listener: 'fdc79e22-adde-11eb-8529-0242ac130003' };
    let signed1 = sign(signObj, tmpSecret);
    let signed2 = sign(signObj, Buffer.from(tmpSecret).toString('base64'));
    let signed3 = sign(signObj, Buffer.from(tmpSecret, 'base64'));
    let signed4 = mySign(signObj);

    let payload1 = undefined;
    let payload2 = undefined;
    let payload3 = undefined;
    let payload4 = undefined;

    try {
        payload1 = verify(signed1, tmpSecret);
    } catch (e) {
        payload1 = ((e && e.name) ? e.name : 'Error') + ': ' + ((e && e.message) ? e.message : 'NoMessage');
    }
    try {
        payload2 = verify(signed2, Buffer.from(tmpSecret).toString('base64'));
    } catch (e) {
        payload2 = ((e && e.name) ? e.name : 'Error') + ': ' + ((e && e.message) ? e.message : 'NoMessage');
    }
    try {
        payload3 = verify(signed3, Buffer.from(tmpSecret, 'base64'));
    } catch (e) {
        payload3 = ((e && e.name) ? e.name : 'Error') + ': ' + ((e && e.message) ? e.message : 'NoMessage');
    }
    try {
        payload4 = myVerify(signed4);
    } catch (e) {
        payload4 = ((e && e.name) ? e.name : 'Error') + ': ' + ((e && e.message) ? e.message : 'NoMessage');
    }

    return {
        status: 200,
        body: {
            message: 'Successful GET occured!',
            signed1: signed1,
            signed2: signed2,
            signed3: signed3,
            signed4: signed4,
            payload1: payload1,
            payload2: payload2,
            payload3: payload3,
            payload4: payload4
        }
    }
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log.info('SpotifyProxy HTTP trigger for Test started');
    context.log.info('HTTP Request: ' + JSON.stringify(req, undefined, 2));
    
    let testApi = CreateApi({ CorsEnabled: true, SecureApis: true })
        .OnGet(false, null, doGet)
        .Build();

    let response = await testApi.Execute(context);
    context.res = response;

};

export default httpTrigger;