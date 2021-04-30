import React from 'react';
import { useAppContext } from './lib/AppContext';
import Authentication from './components/Authentication';
import CurrentTrack from './components/CurrentTrack';
import Loading from './components/Loading';


export default function Listener() {

    const { listenerAuth } = useAppContext();
    const [ loading, setLoading ] = React.useState(true);


    React.useEffect(() => {
        if (!listenerAuth || !listenerAuth.bearer_token) {
            window.location.href = '/';
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
            </>
        )
    );
}