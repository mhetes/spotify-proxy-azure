import React from 'react';
import { Callout } from '@blueprintjs/core';

/**
 * @param {{OnInputChange: (value: string) => void}} props 
 */
export default function SearchInput(props) {

    const [ searchTimer, setSearchTimer ] = React.useState(-1);

    /**
     * @type {(value: string) => void}
     */
    const SearchTimerRun = React.useCallback((value) => {
        setSearchTimer(-1);
        if (typeof props.OnInputChange === 'function') {
            props.OnInputChange(value);
        }
    }, [setSearchTimer, props]);

    /**
     * @type {(value: string) => void}
     */
    const SearchOnChange = React.useCallback((value) => {
        if (searchTimer >= 0) {
            clearTimeout(searchTimer);
        }
        let timerId = setTimeout(SearchTimerRun, 1000, value);
        setSearchTimer(timerId);
    }, [searchTimer, setSearchTimer, SearchTimerRun]);

    return (
        <>
            <Callout title='Vyhľadávanie na spotify' intent='primary' >
            <input type='text' className='bp4-input bp4-fill bp4-large' onChange={ (e) => { SearchOnChange(e.currentTarget.value); }}  />          
            </Callout>
            <br />
        </>
    );
}