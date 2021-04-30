
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

/**
 * 
 * @param {string} text 
 * @param {string} country 
 * @param {string} bearer 
 * @returns {Promise<{type: 'artist'|'track'|'album', id: string, name1: string, name2: string, img: string}[]>}
 */
export async function Search(text, country, bearer) {
    console.info(`SpotifyApi.Search('${text}')`);
    let res = await ExecGetRequest(`https://api.spotify.com/v1/search?q=${encodeURIComponent(text)}&type=track&limit=50${(!country) ? '' : `&market=${country}`}`, bearer);
    if (!res) {
        return null;
    }
    /**
     * @type {{type: 'artist'|'track'|'album', id: string, name1: string, name2: string, img: string}[]}
     */
    let results = [];
    if (res['artists']) {
        let artistItems = res['artists']['items'];
        if (Array.isArray(artistItems) && artistItems.length > 0) {
            artistItems.forEach(artist => {
                results.push({
                    type: artist['type'],
                    id: artist['id'],
                    name1: artist['name'],
                    name2: '',
                    img: (Array.isArray(artist['images']) && artist['images'].length > 0) ? artist['images'][artist['images'].length - 1]['url'] : ''
                });
            });
        }
    }
    if (res['albums']) {
        let albumItems = res['albums']['items'];
        if (Array.isArray(albumItems) && albumItems.length > 0) {
            albumItems.forEach((album) => {
                results.push({
                    type: album['type'],
                    id: album['id'],
                    name1: album['name'],
                    name2: (Array.isArray(album['artists']) && album['artists'].length > 0) ? album['artists'][0]['name'] : '',
                    img: (Array.isArray(album['images']) && album['images'].length > 0) ? album['images'][album['images'].length - 1]['url'] : ''
                });
            });
        }
    }
    if (res['tracks']) {
        let trackItems = res['tracks']['items'];
        if (Array.isArray(trackItems) && trackItems.length > 0) {
            trackItems.forEach((track) => {
                if (track['album']) {
                    results.push({
                        type: track['type'],
                        id: track['id'],
                        name1: track['name'],
                        name2: (Array.isArray(track['artists']) && track['artists'].length > 0) ? track['artists'][0]['name'] : '',
                        img: (Array.isArray(track['album']['images']) && track['album']['images'].length > 0) ? track['album']['images'][track['album']['images'].length - 1]['url'] : ''
                    });
                } else if (Array.isArray(track['artists']) && track['artists'].length > 0) {
                    results.push({
                        type: track['type'],
                        id: track['id'],
                        name1: track['name'],
                        name2: (Array.isArray(track['artists']) && track['artists'].length > 0) ? track['artists'][0]['name'] : '',
                        img: (Array.isArray(track['artists'][0]['images']) && track['artists'][0]['images'].length > 0) ? track['artists'][0]['images'][track['artists'][0]['images'].length - 1]['url'] : ''
                    });
                } else {
                    results.push({
                        type: track['type'],
                        id: track['id'],
                        name1: track['name'],
                        name2: (Array.isArray(track['artists']) && track['artists'].length > 0) ? track['artists'][0]['name'] : '',
                        img: ''
                    });
                }
            });
        }
    }
    return results;
}