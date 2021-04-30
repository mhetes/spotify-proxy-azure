import React from 'react';
import { Callout, ProgressBar } from '@blueprintjs/core';
import { useAppContext } from '../lib/AppContext';
import { GetTrackInfo } from '../lib/SpotifyApi';

/**
 * @param {{type: 'Player' | 'Listener'}} props 
 * @returns {JSX.Element}
 */
export default function CurrentTrack(props) {

    const { playerAuth, listenerAuth } = useAppContext();
    const [ showCurrentTrack, setShowCurrentTrack ] = React.useState(false);
    const [ trackFetching, setTrackFetching ] = React.useState(false);
    const [ songImgUrl, setSongImgUrl ] = React.useState('');
    const [ songName, setSongName ] = React.useState('');
    const [ songArtist, setSongArtist ] = React.useState('');
    const [ songProgress, setSongProgress ] = React.useState(0);
    const [ songPosition, setSongPosition ] = React.useState(0);
    const [ songDutation, setSongDuration ] = React.useState(0);
    const [ songIsPlaying, setSongIsPlaying ] = React.useState(true);
    const [ songDelta, setSongDelta ] = React.useState(0);
    const [ songLastCheck, setSongLastCheck ] = React.useState(0);

    /**
     * @type {() => Promise<[string, boolean, number]|null>}
     */
    const GetCurrentTrack = React.useCallback(async () => {
        let bearer = '';
        if (props.type === 'Player') {
            bearer = (playerAuth && playerAuth.bearer_token) ? playerAuth.bearer_token : '';
        } else if (props.type === 'Listener') {
            bearer = (listenerAuth && listenerAuth.bearer_token) ? listenerAuth.bearer_token : '';
        }
        if (bearer === '') {
            return null;
        }
        console.info(`Executing GET /api/player started with ${props.type} bearer`);
        try {
            let trackRes = await fetch(`/api/player`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${bearer}`
                }
            });
            if (!trackRes.ok) {
                console.log('Error payload: ' + JSON.stringify(await trackRes.json()));
                throw new Error(`Invalid HTTP Status ${trackRes.status}!`);
            }
            let data = await trackRes.json();
            console.info(`GET /api/player finished`);
            if (!data || !data['track_id'] || typeof data['track_id'] !== 'string'|| (typeof data['is_playing'] !== 'boolean' && data['is_playing'] !== null) || !data['progress_ms'] || typeof data['progress_ms'] !== 'number') {
                console.info(`Payload: ${JSON.stringify(data)}`);
                throw new Error(`Invalid JSON response - missing or invalid fields!`);
            }
            return [data['track_id'], data['is_playing'], data['progress_ms']];
        } catch (e) {
            console.error('GET /api/player FAILED with error: ');
            console.error(e);
            return null;
        }
    }, [props.type, playerAuth, listenerAuth])

    const RefreshCurrentTrack = React.useCallback(async () => {
        if (trackFetching) { return; }
        setTrackFetching(true);
        setSongLastCheck(Date.now());
        let sp_country = '';
        let sp_token = '';
        if (props.type === 'Player') {
            sp_country = playerAuth.spotify_country;
            sp_token = playerAuth.spotify_token;
        } else if (props.type === 'Listener') {
            sp_country = listenerAuth.spotify_country;
            sp_token = listenerAuth.spotify_token;
        }
        if (sp_country === '' || sp_token === '') {
            setTrackFetching(false);
            setShowCurrentTrack(false);
            return;
        }
        let trackRes = await GetCurrentTrack();
        if (!trackRes) {
            setTrackFetching(false);
            setShowCurrentTrack(false);
            return;
        }
        let trackId = trackRes[0];
        let isPlaying = trackRes[1];
        let progressMs = trackRes[2];
        let trackInfo = await GetTrackInfo(trackId, sp_country, sp_token);
        if (!trackInfo || !trackInfo.artist || !trackInfo.name || !trackInfo.album || !trackInfo.url || !trackInfo.duration) {
            setTrackFetching(false);
            setShowCurrentTrack(false);
            return;
        }
        setSongName(trackInfo.name);
        setSongArtist(trackInfo.artist);
        setSongImgUrl(trackInfo.url);
        setSongProgress(progressMs / trackInfo.duration);
        setSongPosition(progressMs);
        setSongDuration(trackInfo.duration);
        setSongIsPlaying(isPlaying);
        setSongDelta(0);
        setTrackFetching(false);
        setShowCurrentTrack(true);
    }, [props.type, playerAuth, listenerAuth, trackFetching, setSongLastCheck, setShowCurrentTrack, setTrackFetching, GetCurrentTrack, setSongName, setSongArtist, setSongImgUrl, setSongProgress, setSongPosition, setSongDuration, setSongIsPlaying, setSongDelta]);

    const IntervalTickSecond = React.useCallback(async () => {
        if (showCurrentTrack) {
            let newDelta = songDelta;
            if (songIsPlaying) {
                newDelta += 1000;
            }
            if (newDelta > 10000) {
                RefreshCurrentTrack();
            }
            let currentPos = songPosition + newDelta;
            if (currentPos > songDutation) {
                currentPos = songDutation;
                RefreshCurrentTrack();
            }
            setSongProgress(currentPos / songDutation);
            setSongDelta(newDelta);
        }
        if ((Date.now() - songLastCheck) > 10000) {
            RefreshCurrentTrack();
        }
    }, [showCurrentTrack, songIsPlaying, songDelta, setSongDelta, setSongProgress, songPosition, songDutation, RefreshCurrentTrack, songLastCheck]);

    React.useEffect(() => {
        let secInt = setInterval(IntervalTickSecond, 1000);
        return () => {
            clearInterval(secInt);
        };
    }, [IntervalTickSecond, RefreshCurrentTrack]);

    return (
        showCurrentTrack ? (
            <>
                <Callout title='Aktuálne prehrávané' intent='none' >
                    <img src={songImgUrl} alt='Cover' className='sp_img_left' />
                    <div className='sp_current_track'>
                        <strong>{songName}</strong><br />
                        {songArtist}<br />
                        <ProgressBar intent='success' animate={true} stripes={true} value={songProgress}></ProgressBar>
                    </div>
                    <br />
                </Callout>
                <br />
            </>
        ) : (<></>)
    );
}