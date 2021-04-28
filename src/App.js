import { Text, H3, Callout, Card, Elevation } from '@blueprintjs/core';
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import 'normalize.css/normalize.css'
import './styles.css'
import Header from './components/Header';

export default function App() {
    return (
        <>
            <Header key="header" />
            <div id="main">
                <div id="page">
                    <br />
                    <Callout title="Spotify Proxy" intent="primary">
                        Aplikácia Spotify Proxy slúži na zdieľanie funkcionality <strong>Pridaj do Zoznamu</strong> (Add&nbsp;to&nbsp;Queue) aktívneho Spotify prehrávača (na PC, mobile alebo webe).<br /><br />
                        <strong>Postup:</strong>
                        <ul>
                            <li>Klikni na tlačidlo <strong>Prihlásenie do Spotify Proxy</strong></li>
                            <li><strong>Prihlásiš</strong> sa do svojho <strong>Spotify účtu</strong></li>
                            <li>Autorizuješ aplikáciu <strong>Spotify Proxy</strong> kliknutím na tlačidlo <strong>Súhlasím</strong></li>
                            <li>Po presmerovaní späť na web <strong>Spotify Proxy</strong> sa zobrazí <strong>QR Kód</strong></li>
                            <li>Tento QR Kód si <strong>naskenujú mobilom</strong> tvoji kamoši</li>
                            <li>Kód obsahuje web adresu do <strong>Spotify Proxy</strong> ktorú si otvoria v prehliadači</li>
                            <li>Dostanú sa na stránku kde budú môcť <strong>vyhľadávať pesničky</strong> na Spotify</li>
                            <li>A tie <strong>Pridávať do Zoznamu</strong> tvojho aktívneho Spotify prehrávača</li>
                        </ul>
                    </Callout>
                    <br />
                    <Callout title="Dôležité upozornenie" intent="warning">
                        Pre správnu funkcionalitu Pridaj do Zoznamu pomocou Spotify Proxy je nutné:
                        <ul>
                            <li>Mať predplatené Spotify Premium</li>
                            <li>Prehrávanie v Spotify aplikácii musí bežať</li>
                        </ul>
                        <strong>Inak Spotify Proxy nebude pracovať správne!</strong>
                    </Callout>
                    <br />
                    <Card interactive={true} elevation={Elevation.FOUR}>
                        <H3>Prihlásenie do Spotify Proxy</H3>
                        <div id="spotify_login">
                            <img src="/spotify_logo.png" alt="Spotify prihlásenie" />
                            <span>Login</span>
                        </div>                        
                    </Card>
                    <br />
                    <Card interactive={true} elevation={Elevation.FOUR}>
                        <H3>Aktívne prihlásenie - Prehrávač</H3>
                        <Text className="user_logged">Martin Heteš</Text>                    
                    </Card>
                    <br />
                    <Card interactive={true} elevation={Elevation.FOUR}>
                        <H3>Aktívne prihlásenie - Poslucháč prehrávača</H3>
                        <Text className="user_logged">Martin Heteš</Text>                    
                    </Card>
                </div>
            </div>
        </>
    );
}
