import { Callout, Spinner } from '@blueprintjs/core';

export default function Loading() {
    return (
        <>
            <Callout intent='none' >
                <br /><br />
                <Spinner intent='success' size='100' />
                <br /><br />
            </Callout>
            <br />
        </>
    )
}