import React from 'react';

export default function Home(): JSX.Element {

    return (
        <>
            <h1>HOME</h1>
            <ul>
                <li><a href="/Player">Player</a></li>
                <li><a href="/Listener">Listener</a></li>
                <li><a href="/XXX">Error</a></li>
            </ul>
        </>
    );
}