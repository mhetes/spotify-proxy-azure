import React from 'react';
import { Callout, Button, Position, OverlayToaster } from '@blueprintjs/core';
import Loading from './Loading';
import { useAppContext } from '../lib/AppContext';
import { Search } from '../lib/SpotifyApi';

/**
 * @type {React.RefObject<OverlayToaster>}
 */
const toastRef = React.createRef();

/**
 * @param {{search: string}} props 
 */
export default function SearchResults(props) {

    const { listenerAuth } = useAppContext();
    const [ searchText, setSearchText ] = React.useState('');
    const [ searchedText, setSearchedText ] = React.useState('');
    const [ searchRunning, setSearchRunning ] = React.useState(false);
    const [ searchResults, setSearchResults ] = React.useState([]);
    const [ loading, setLoading ] = React.useState(false);
    const [ display, setDisplay ] = React.useState('search');
    /* const [ displayId, setDisplayId ] = React.useState(''); */

    /**
     * @type {(track_id: string, name: string, artist: string) => Promise<void>}
     */
    const AddTrackToQueue = React.useCallback(async (track_id, name, artist) => {
        console.log('AddTrackToQueue: ' + track_id);
        let success = false;
        console.info(`Executing POST /api/player`);
        try {
            let queueRes = await fetch(`/api/player`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${listenerAuth.bearer_token}`
                },
                body: JSON.stringify({ track_id: track_id })
            });
            if (!queueRes.ok) {
                console.log('Input Payload: ' + JSON.stringify({ track_id: track_id }, undefined, 2));
                console.log('Error response: ' + JSON.stringify(await queueRes.json(), undefined, 2));
                throw new Error(`Invalid HTTP Status ${queueRes.status}!`);
            }
            success = true;
        } catch (e) {
            console.error('POST /api/player FAILED with error: ');
            console.error(e);
            success = false;
        }
        if (success) {
            if (toastRef.current) {
                toastRef.current.show({
                    message: `${artist}: ${name} bol pridaný do queue`,
                    intent: 'success',
                    icon: 'tick-circle'
                });
            }
        } else {
            if (toastRef.current) {
                toastRef.current.show({
                    message: `Chyba pridanie songu ${artist}: ${name}`,
                    intent: 'danger',
                    icon: 'warning-sign'
                });
            }
        }
    }, [listenerAuth.bearer_token]);

    const ShowAlbum = React.useCallback(async (album_id) => {
        console.log('ShowAlbum: ' + album_id);
    }, []);

    const ShowArtist = React.useCallback(async (artist_id) => {
        console.log('ShowArtist: ' + artist_id);
    }, []);

    const ExecuteSearch = React.useCallback(async () => {
        if (searchRunning) { return; }
        setSearchRunning(true);
        setLoading(true);
        setDisplay('search');
        setSearchedText(searchText);
        let results = await Search(searchText, listenerAuth.spotify_country, listenerAuth.spotify_token);
        if (!results) {
            setSearchResults([]);
        } else {
            setSearchResults(results);
        }
        setSearchRunning(false);
        setLoading(false);
    }, [searchRunning, setSearchRunning, setLoading, searchText, listenerAuth, setSearchResults, setSearchedText]);

    React.useEffect(() => {
        if (searchText.length >= 3 && !searchRunning && searchText !== searchedText) {
            ExecuteSearch();
        }
    }, [searchText, searchedText, searchRunning, ExecuteSearch]);

    React.useEffect(() => {
        if (props.search !== searchText) {
            if (props.search.length >= 3) {
                setSearchText(props.search);
            } else {
                setSearchText('');
            }
        }
    }, [props.search, searchText, setSearchText]);

    /**
     * @type {(value: string) => string}
     */
    const typeRewrite = React.useCallback((value) => {
        if (value === 'artist') {
            return 'Interprét';
        } else if (value === 'track') {
            return 'Song';
        } else if (value === 'album') {
            return 'Album'
        }
        return '';
    }, []);

    return (
        <>
            
            { display === 'search' && (
                <>
                    { loading ? (<Loading />) : (
                        <>
                        <Callout title='Vyhľadávanie' intent='none' >
                        <br />
                            { searchText === '' ? (<>Vyhľadaj niečo na Spotify...</>) : (<>
                                {searchResults.map((res, idx) => (
                                <div key={`search_res_${idx}`}>
                                    <img src={res.img} alt='Cover' className='sp_img_left' />
                                    { res.type === 'track' && (
                                        <Button className='right_button' intent='success' icon='add' onClick={(e) => { AddTrackToQueue(res.id, res.name1, res.name2); }}></Button>
                                    ) }
                                    { res.type === 'album' && (
                                        <Button className='right_button' intent='none' icon='more' onClick={(e) => { ShowAlbum(res.id); }}></Button>
                                    ) }
                                    { res.type === 'artist' && (
                                        <Button className='right_button' intent='none' icon='more' onClick={(e) => { ShowArtist(res.id); }}></Button>
                                    ) }
                                    <div className='sp_current_track'>
                                        <strong>{res.name1}</strong><br />
                                        {res.name2}<br />
                                        {typeRewrite(res.type)}<br />
                                    </div>
                                </div>
                                ))}
                            </>) }
                        <br /><br />     
                        </Callout>
                        <br />
                        </>
                    ) }
                </>
            ) }
            { display === 'artist' && (
                <>
                    { loading ? (<Loading />) : (
                        <>
                            { searchText === '' ? (<>Vyhľadaj niečo na Spotify...</>) : (<>{searchText}</>) }
                        </>
                    ) }
                </>
            ) }
            { display === 'album' && (
                <>
                    { loading ? (<Loading />) : (
                        <>
                            { searchText === '' ? (<>Vyhľadaj niečo na Spotify...</>) : (<>{searchText}</>) }
                        </>
                    ) }
                </>
            ) }
            
            <OverlayToaster position={Position.BOTTOM_RIGHT} ref={toastRef} />            
        </>
    );
}