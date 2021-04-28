import { Text, H3, Callout, Card, Elevation } from '@blueprintjs/core';

export default function Home() {
    return (
        <>
            <br />
            <Card interactive={true} elevation={Elevation.FOUR} onClick={(e) => { console.log('Spotify Login'); }}>
                <H3>Prihlásenie do Spotify Proxy</H3>
                <div id="spotify_login">
                    <img src="/spotify_logo.png" alt="Spotify prihlásenie" />
                </div>                        
            </Card>
            <br />
            <Card interactive={true} elevation={Elevation.FOUR} onClick={(e) => { window.location.href = '/Player/'; }}>
                <H3>Aktívne prihlásenie - Prehrávač</H3>
                <Text className="user_logged">Martin Heteš</Text>                    
            </Card>
            <br />
            <Card interactive={true} elevation={Elevation.FOUR} onClick={(e) => { window.location.href = '/Listener/'; }}>
                <H3>Aktívne prihlásenie - Poslucháč</H3>
                <Text className="user_logged">Martin Heteš</Text>                    
            </Card>
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
        </>
    );
}
