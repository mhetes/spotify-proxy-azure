import { Button, Callout, ProgressBar } from '@blueprintjs/core';
import QRCode from 'react-qr-code';

export default function Player() {

    return (
        <>
            <Callout title="Prihlásenie do SPOTIFY úspešné" intent="success" >
                <Button className="logout_button" intent="danger" icon="log-out" onClick={(e) => { window.location.href = '/'; }}>Odhlásiť</Button>
                <strong>Užívateľ:</strong> Martin Heteš<br />
                <strong>Krajina:</strong> SK<br />
                
            </Callout>
            <br />
            <Callout title="Aktuálne prehrávané" intent="none" >
                <img src="https://i.scdn.co/image/ab67616d000048519c284a6855f4945dc5a3cd73" alt="Cover" style={{float: 'left'}} />
                <div style={{paddingLeft: 65, margin: 10}}>
                    <strong>Mr. Brightside</strong><br />
                    The Killers<br />
                    <ProgressBar intent="success" animate={true} stripes={true} value={0.6}></ProgressBar>
                </div>
                <br />
            </Callout>
            <br />
            <Callout title="QR Kód na zdieľanie Spotify prehrávača" intent="primary" >
                <div id="qr_code">
                    <QRCode value="http://localhost:3000/Player/?player_id=sefs4efs684g&amp;code=afsgsrgsekhsekshekseh" size={250} />
                </div>            
            </Callout>
            <br />
            <Callout title="Link na zdieľanie prehrávača" intent="primary" >
                <br />
                <input type="text" className="bp4-input bp4-fill bp4-large" readOnly value="http://localhost:3000/Player/?player_id=sefs4efs684g&amp;code=afsgsrgsekhsekshekseh"/>
                <br /><br />
                <Button intent="none" className="bp4-fill bp4-large" onClick={(e) => { navigator.clipboard.writeText('http://localhost:3000/Player/?player_id=sefs4efs684g&code=afsgsrgsekhsekshekseh') }}>Kopírovať do schránky</Button>
                <br />
            </Callout>
        </>
    );
}