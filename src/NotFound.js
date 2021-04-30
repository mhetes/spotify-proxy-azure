import Error from './components/Error';

export default function NotFound() {

    return (
        <Error errorMessage='Zvolená stránka neexistuje! Skontroluj zadanú WWW adresu!' />
    );
}