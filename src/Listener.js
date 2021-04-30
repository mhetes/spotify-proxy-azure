import React from 'react';
import { useAppContext } from './lib/AppContext';
import Authentication from './components/Authentication';
import CurrentTrack from './components/CurrentTrack';
import Loading from './components/Loading';
import SearchInput from './components/SearchInput';
import SearchResults from './components/SearchResults';

export default function Listener() {

    const { listenerAuth } = useAppContext();
    const [ loading, setLoading ] = React.useState(true);
    const [ searchString, setSearchString ] = React.useState('');

    /**
     * @type {(value: string) => void}
     */
    const SearchInputReceived = React.useCallback((value) => {
        setSearchString(value);
    }, [setSearchString]);

    React.useEffect(() => {
        if (!listenerAuth || !listenerAuth.bearer_token) {
            window.location.href = '/';
            return;
        }
        if (new URL(window.location.href).pathname !== '/Listener/') {
            window.location.href = '/Listener/';
            return;
        }
        setLoading(false);
    }, [listenerAuth, setLoading]);

    return (
        loading ? (<Loading />) : (
            <>
                <br />
                <Authentication type='Listener' />
                <CurrentTrack type='Listener' />
                <SearchInput OnInputChange={ (value) => { SearchInputReceived(value) } } />
                <SearchResults search={searchString} />
            </>
        )
    );
}