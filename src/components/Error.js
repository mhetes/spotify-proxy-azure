import { Callout, Button } from '@blueprintjs/core';

/**
 * @param {{errorMessage: string}} props 
 * @returns {JSX.Element}
 */
export default function Error(props) {
    return (
        <>
            <Callout title='Chyba!' intent='danger' >
                <br />
                {props.errorMessage}
                <br /><br /><br />
                <Button intent='danger' className='bp4-fill bp4-large' onClick={(e) => { window.location.href = '/'; }}>Späť na hlavnú stránku</Button>
                <br /><br />
            </Callout>
            <br />
        </>
    )
}