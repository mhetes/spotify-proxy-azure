
/**
 * 
 * @param {string} url 
 * @param {string} bearer
 * @return {Promise<object|null>} 
 */
async function ExecGetRequest(url, bearer) {
    console.info(`Spotify Call started: GET ${url}`);
    try {
        let getRes = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${bearer}`
            }
        });
        if (!getRes.ok) {
            console.log('Error payload: ' + JSON.stringify(await getRes.json()));
            throw new Error(`Invalid HTTP Status ${getRes.status}!`);
        }
        let data = await getRes.json();
        return data;
    } catch (e) {
        console.error(`Spotify Call failed: GET ${url}`);
        console.error(e);
        return null
    }
}

async function ExecPostRequest(url, payload, bearer) {

}

/**
 * 
 * @param {string} uri 
 * @returns {string|null}
 */
function SpotifyUri2Id(uri) {
    if (!uri) {
        return null;
    }
    if (uri.includes(':')) {
        let splitted = uri.split(':');
        return splitted[splitted.length - 1];
    } else {
        return uri;
    }
}

/**
 * 
 * @param {string} track 
 * @param {string} country
 * @param {string} bearer 
 * @returns {Promise<{name: string, artist: string, album: string, url: string, duration: number}|null>}
 */
export async function GetTrackInfo(track, country, bearer) {
    console.info(`SpotifyApi.GetTrackInfo('${track}')`);
    let trackId = SpotifyUri2Id(track);
    if (!trackId || !bearer) {
        return null;
    }
    let res = await ExecGetRequest(`https://api.spotify.com/v1/tracks/${trackId}${(!country) ? '' : `?market=${country}`}`, bearer);
    if (!res) {
        return null;
    }
    return {
        name: (res && res['name']) ? res['name'] : '',
        artist: (Array.isArray(res['artists']) && res['artists'].length > 0 && res['artists'][0]['name']) ? res['artists'][0]['name'] : '',
        album: (res['album'] && res['album']['name']) ? res['album']['name'] : '',
        url: (res['album'] && Array.isArray(res['album']['images']) && res['album']['images'].length > 0 && res['album']['images'][res['album']['images'].length - 1]['url']) ? res['album']['images'][res['album']['images'].length - 1]['url'] : '',
        duration: (res['duration_ms']) ? res['duration_ms'] : 0
    }
}