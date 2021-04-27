import { Context } from '@azure/functions';
import { sign, verify } from 'jsonwebtoken';
import { GetJwtSecret } from './EnvironmentVariables';

export enum ERole {
    Player = 'Player',
    Listener = 'Listener'
}

export interface IAuthentication {
    Role: ERole | 'Unauthenticated';
    PlayerId: string;
    ListenerId: string | undefined;
    Bearer: string | undefined;
}

export class Security {

    public static CreateAuthentication(role: ERole, playerId: string, listenerId: string | undefined, context: Context): string | undefined {
        context.log.info(`Security.CreateAuthentication('${role}', '${playerId}', ${(!listenerId) ? 'undefined' : "'" + listenerId + "'"})`);
        if (!role) {
            context.log.error(`ERROR: Missing 'role' for token creation!`);
            return undefined;
        }
        if (role !== ERole.Listener && role !== ERole.Player) {
            context.log.error(`ERROR: Invalid 'role' value '${role}' for token creation!`);
            return undefined;
        }
        if (!playerId) {
            context.log.error(`ERROR: Missing 'playerId' for token creation!`);
            return undefined;
        }
        if (role === ERole.Listener && !listenerId) {
            context.log.error(`ERROR: Missing 'listenerId' for token creation!`);
        }
        if (role === ERole.Player && listenerId) {
            listenerId = undefined;
        }
        let secret = GetJwtSecret();
        if (!secret) {
            context.log.error(`ERROR: Cannot obtain JWT Secret`);
            return undefined;
        }
        try {
            let bearer = sign({ role: role, player: playerId, listener: listenerId }, secret);
            if (!bearer) {
                context.log.error(`ERROR: JWT Sign returned empty bearer`);
                return undefined;
            }
            return bearer;
        } catch (e) {
            context.log.error(`ERROR: Failed to create JWT token with exception: `);
            context.log.error(e);
            return undefined;
        }
    }

    public static VerifyAuthentication(bearer: string, context: Context): IAuthentication {
        context.log.info(`Security.VerifyAuthentication('${bearer}')`);
        let secret = GetJwtSecret();
        if (!secret) {
            context.log.error(`ERROR: Cannot obtain JWT Secret`);
            return {
                Role: 'Unauthenticated',
                PlayerId: context.invocationId,
                ListenerId: context.invocationId,
                Bearer: undefined
            } as IAuthentication;
        }
        try {
            let decoded = verify(bearer, secret);
            if (!decoded['player'] || !decoded['role'] || (decoded['role'] !== ERole.Player && decoded['role'] !== ERole.Listener)) {
                context.log.warn(`WARNING: Token verification successful but payload is incomplete: `);
                context.log.warn(decoded);
                return {
                    Role: 'Unauthenticated',
                    PlayerId: context.invocationId,
                    ListenerId: context.invocationId,
                    Bearer: bearer
                } as IAuthentication;
            }
            context.log.info(`Decoded Bearer: ${JSON.stringify(decoded)}`);
            return {
                Role: decoded['role'],
                PlayerId: decoded['player'],
                ListenerId: decoded['listener'],
                Bearer: bearer
            } as IAuthentication;
        } catch (e) {
            context.log.warn(`WARNING: Failed to verify JWT token with exception: `);
            context.log.warn(e);
            return {
                Role: 'Unauthenticated',
                PlayerId: context.invocationId,
                ListenerId: context.invocationId,
                Bearer: undefined
            } as IAuthentication;
        }
    }

    public static RandomString(length: number): string {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
}
