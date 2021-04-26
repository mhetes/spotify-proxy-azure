import React from 'react';
import ReactDOM from 'react-dom';

function Example(): JSX.Element {

    const [loading, setLoading] = React.useState(true);
    const [response, setResponse] = React.useState('Waiting for response...');

    const loadResponse = React.useCallback(async () => {
        try {
            if (loading) {
                setLoading(false);
            }
            let res = await fetch('/api/test', {
                method: 'POST',
                body: JSON.stringify({data: 'xxx'}),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            if (!res.ok) {
                throw new Error('Not success response');
            }
            let data = await res.json();
            setResponse(data.message);
        } catch (e) {
            console.error('GetMessage fetch failed:');
            console.error(e);
            setResponse('GetMessage fetch failed');
        }
    }, [setLoading, setResponse]);

    React.useEffect(() => {
        if (loading) {
            loadResponse();
        }
    }, [loading]);

    return (
        <div>Response: {response}</div>
    )
}

if (document.getElementById('root')) {
    ReactDOM.render(<Example />, document.getElementById('root'));
}