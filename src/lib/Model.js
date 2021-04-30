
export class ListenerAuthentication {
    /**
     * Creates new instance of ListenerAuthentication
     * @param {ListenerAuthentication | undefined} la ListenerAuthentication compatible object or undefined
     */
    constructor(la) {
        this.bearer_token = StringOrNull(la?.bearer_token);
        this.spotify_token = StringOrNull(la?.spotify_token);
        this.spotify_expire = DateOrNull(la?.spotify_expire);
        this.spotify_country = StringOrNull(la?.spotify_country);
        this.spotify_user_id = StringOrNull(la?.spotify_user_id);
        this.spotify_user_name = StringOrNull(la?.spotify_user_name);
    }
}

export class PlayerAuthentication extends ListenerAuthentication {
    /**
     * Creates new instance of PlayerAuthentication
     * @param {PlayerAuthentication | undefined} pa PlayerAuthentication compatible object or undefined
     */
    constructor(pa) {
        super(pa);
        this.player_id = StringOrNull(pa?.player_id);
        this.player_code = StringOrNull(pa?.player_code);
    }
}


/**
 * Enforces String value of element or sets NULL
 * @param {any} value 
 * @returns {string|null}
 */
function StringOrNull(value) {
    if (typeof value === 'string') {
        return String(value);
    } else {
        return null;
    }
}

/**
 * Enforces Date value of element or sets NULL
 * @param {any} value 
 * @returns {Date|null}
 */
function DateOrNull(value) {
    if (typeof value === 'string') {
        let date = new Date(value);
        if (isNaN(date.getTime())) {
            return null;
        } else {
            return date;
        }
    } else if (typeof value === 'number') {
        return new Date(value);
    } else if (typeof value === 'object' && value instanceof Date) {
        return value;
    } else {
        return null;
    }
}