import { useContext, createContext } from 'react';
import { PlayerAuthentication, ListenerAuthentication } from './Model';

export class AppStateContext {
    /**
     * Creates new instance of AppStateContext
     * @param {AppStateContext} asc AppStateContext compatible object or null
     */
    constructor(asc) {
        this.listenerAuth = (!asc) ? null : new ListenerAuthentication(asc.listenerAuth);
        this.playerAuth = (!asc) ? null : new PlayerAuthentication(asc.playerAuth);
    }
}

/**
 * Creates new Context Provider for AppStateContext
 * @type {React.Context<AppStateContext>}
 */
export const AppContext = createContext(null);

/**
 * Obtain current AppStateContext
 * @returns {AppStateContext}
 */
export function useAppContext() {
    return useContext(AppContext);
}
