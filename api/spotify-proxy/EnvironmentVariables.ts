export function GetAllowedOrigins(): string | undefined {
    return process.env['SP_ALLOWED_ORIGINS'];
}

export function GetJwtSecret(): string | undefined {
    return process.env['SP_JWT_SECRET'];
}

export function GetSpotifyAppCode(): string | undefined {
    return process.env['SP_SPOTIFY_APP_CODE'];
}

export function GetSpotifyAppSecret(): string | undefined {
    return process.env['SP_SPOTIFY_APP_SECRET'];
}

export function GetSpotifyAppCallback(): string | undefined {
    return process.env['SP_SPOTIFY_APP_CALLBACK'];
}

export function GetCosmosEndpoint(): string | undefined {
    return process.env['SP_COSMOS_ENDPOINT'];
}

export function GetCosmosKey(): string | undefined {
    return process.env['SP_COSMOS_KEY'];
}

export function GetCosmosDatabase(): string | undefined {
    return process.env['SP_COSMOS_DATABASE'];
}

export function GetCosmosContainer(): string | undefined {
    return process.env['SP_COSMOS_CONTAINER'];
}
