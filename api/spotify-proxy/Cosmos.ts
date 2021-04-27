import { Context } from '@azure/functions';
import { CosmosClient, DeleteOperationInput } from '@azure/cosmos';
import { v1 } from 'uuid';
import { GetCosmosEndpoint, GetCosmosKey, GetCosmosDatabase, GetCosmosContainer } from './EnvironmentVariables';

const PK_Player = 'Player';
const PK_Listener = 'Listener';

export interface DbPlayer {
    id: string;
    record: typeof PK_Player,
    spotify_token: string;
    spotify_expire: Date;
    spotify_refresh: string;
    spotify_country: string;
    spotify_user_id: string;
    spotify_user_name: string;
    player_code: string;
}

export interface DbListener {
    id: string;
    record: typeof PK_Listener,
    player_id: string;
    spotify_token: string;
    spotify_expire: Date;
}

function PlayerInput(item: DbPlayer): DbPlayer {
    return {
        id: (!item || !item.id || typeof item.id !== 'string') ? v1() : item.id,
        record: 'Player',
        spotify_token: (!item || !item.spotify_token || typeof item.spotify_token !== 'string') ? '' : item.spotify_token,
        spotify_expire: (!item || !item.spotify_expire || !(item.spotify_expire instanceof Date)) ? new Date() : item.spotify_expire,
        spotify_refresh: (!item || !item.spotify_refresh || typeof item.spotify_refresh !== 'string') ? '' : item.spotify_refresh,
        spotify_country: (!item || !item.spotify_country || typeof item.spotify_country !== 'string') ? '' : item.spotify_country,
        spotify_user_id: (!item || !item.spotify_user_id || typeof item.spotify_user_id !== 'string') ? '' : item.spotify_user_id,
        spotify_user_name: (!item || !item.spotify_user_name || typeof item.spotify_user_name !== 'string') ? '' : item.spotify_user_name,
        player_code: (!item || !item.player_code || typeof item.player_code !== 'string') ? '' : item.player_code        
    } as DbPlayer;
}

function PlayerOutput(item: DbPlayer | undefined): DbPlayer | undefined {
    if (!item) {
        return undefined;
    } else {
        return {
            id: item.id,
            record: item.record,
            spotify_token: item.spotify_token,
            spotify_expire: new Date(item.spotify_expire),
            spotify_refresh: item.spotify_refresh,
            spotify_country: item.spotify_country,
            spotify_user_id: item.spotify_user_id,
            spotify_user_name: item.spotify_user_name,
            player_code: item.player_code            
        } as DbPlayer;
    }
}

function ListenerInput(item: DbListener): DbListener {
    return {
        id: (!item || !item.id || typeof item.id !== 'string') ? v1() : item.id,
        record: 'Listener',
        player_id: (!item || !item.player_id || typeof item.player_id !== 'string') ? '' : item.player_id,
        spotify_token: (!item || !item.spotify_token || typeof item.spotify_token !== 'string') ? '' : item.spotify_token,
        spotify_expire: (!item || !item.spotify_expire || !(item.spotify_expire instanceof Date)) ? new Date() : item.spotify_expire
    } as DbListener;
}

function ListenerOutput(item: DbListener | undefined): DbListener | undefined {
    if (!item) {
        return undefined;
    } else {
        return {
            id: item.id,
            record: item.record,
            player_id: item.player_id,
            spotify_token: item.spotify_token,
            spotify_expire: new Date(item.spotify_expire)
        } as DbListener;
    }
}

function throwIfMissingVariables(context: Context) {
    let doThrow = false;
    if (!GetCosmosEndpoint()) {
        doThrow = true;
        context.log.error(`Missing Environment variable for: CosmosEndpoint`);
    }
    if (!GetCosmosKey()) {
        doThrow = true;
        context.log.error(`Missing Environment variable for: CosmosKey`);
    }
    if (!GetCosmosDatabase()) {
        doThrow = true;
        context.log.error(`Missing Environment variable for: CosmosDatabase`);
    }
    if (!GetCosmosContainer()) {
        doThrow = true;
        context.log.error(`Missing Environment variable for: CosmosContainer`);
    }
    if (doThrow) {
        throw new Error(`Missing CosmosDB Configuration!`);
    }
}

export class Cosmos {

    public static async CreatePlayer(item: DbPlayer, context: Context): Promise<DbPlayer> {
        context.log.info(`Cosmos.CreatePlayer(${JSON.stringify(item)})`);
        throwIfMissingVariables(context);
        let container = new CosmosClient({ endpoint: GetCosmosEndpoint(), key: GetCosmosKey() }).database(GetCosmosDatabase()).container(GetCosmosContainer());
        let res = await container.items.create(PlayerInput(item));
        return PlayerOutput(res.resource);
    }

    public static async UpdatePlayer(item: DbPlayer, context: Context): Promise<DbPlayer> {
        context.log.info(`Cosmos.UpdatePlayer(${JSON.stringify(item)})`);
        throwIfMissingVariables(context);
        let container = new CosmosClient({ endpoint: GetCosmosEndpoint(), key: GetCosmosKey() }).database(GetCosmosDatabase()).container(GetCosmosContainer());
        let res = await container.item(item.id, PK_Player).replace(PlayerInput(item));
        return PlayerOutput(res.resource);
    }

    public static async GetPlayer(id: string, context: Context): Promise<DbPlayer | undefined> {
        context.log.info(`Cosmos.GetPlayer(${id})`);
        throwIfMissingVariables(context);
        let container = new CosmosClient({ endpoint: GetCosmosEndpoint(), key: GetCosmosKey() }).database(GetCosmosDatabase()).container(GetCosmosContainer());
        let res = await container.item(id, PK_Player).read<DbPlayer>();
        return PlayerOutput(res.resource);
    }

    public static async DeletePlayer(id: string, context: Context): Promise<void> {
        context.log.info(`Cosmos.DeletePlayer(${id})`);
        throwIfMissingVariables(context);
        let container = new CosmosClient({ endpoint: GetCosmosEndpoint(), key: GetCosmosKey() }).database(GetCosmosDatabase()).container(GetCosmosContainer());
        await container.item(id, PK_Player).delete<DbPlayer>();
    }

    public static async CreateListener(item: DbListener, context: Context): Promise<DbListener> {
        context.log.info(`Cosmos.CreateListener(${JSON.stringify(item)})`);
        throwIfMissingVariables(context);
        let container = new CosmosClient({ endpoint: GetCosmosEndpoint(), key: GetCosmosKey() }).database(GetCosmosDatabase()).container(GetCosmosContainer());
        let res = await container.items.create(ListenerInput(item));
        return ListenerOutput(res.resource);
    }

    public static async UpdateListener(item: DbListener, context: Context): Promise<DbListener> {
        context.log.info(`Cosmos.UpdateListener(${JSON.stringify(item)})`);
        throwIfMissingVariables(context);
        let container = new CosmosClient({ endpoint: GetCosmosEndpoint(), key: GetCosmosKey() }).database(GetCosmosDatabase()).container(GetCosmosContainer());
        let res = await container.item(item.id, PK_Listener).replace(ListenerInput(item));
        return ListenerOutput(res.resource);
    }

    public static async GetListener(id: string, context: Context): Promise<DbListener | undefined> {
        context.log.info(`Cosmos.GetListener('${id}')`);
        throwIfMissingVariables(context);
        let container = new CosmosClient({ endpoint: GetCosmosEndpoint(), key: GetCosmosKey() }).database(GetCosmosDatabase()).container(GetCosmosContainer());
        let res = await container.item(id, PK_Listener).read<DbListener>();
        return ListenerOutput(res.resource);
    }

    public static async DeleteListener(id: string, context: Context): Promise<void> {
        context.log.info(`Cosmos.DeleteListener('${id}')`);
        throwIfMissingVariables(context);
        let container = new CosmosClient({ endpoint: GetCosmosEndpoint(), key: GetCosmosKey() }).database(GetCosmosDatabase()).container(GetCosmosContainer());
        await container.item(id, PK_Listener).delete();
    }

    public static async PurgePlayerListeners(player_id: string, context: Context): Promise<void> {
        context.log.info(`Cosmos.PurgePlayerListeners('${player_id}')`);
        throwIfMissingVariables(context);
        let container = new CosmosClient({ endpoint: GetCosmosEndpoint(), key: GetCosmosKey() }).database(GetCosmosDatabase()).container(GetCosmosContainer());
        let deleteOps = [] as DeleteOperationInput[];
        let queried = await container.items.query<{id: string}>({
            query: 'SELECT r.id FROM root r WHERE r.player_id = @player_id',
            parameters: [
                { name: '@player_id', value: player_id }
            ]
        }, { partitionKey: PK_Listener }).fetchAll();
        queried.resources.forEach(resource => { deleteOps.push({ operationType: 'Delete', id: resource.id, partitionKey: PK_Listener }); });        
        await container.items.bulk(deleteOps);
    }
}

