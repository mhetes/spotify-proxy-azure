import { BrowserRouter, Switch, Route } from 'react-router-dom'
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import 'normalize.css/normalize.css'
import './styles.css'
import Header from './components/Header';
import Home from './Home';
import Player from './Player';
import Listener from './Listener';
import NotFound from './NotFound';

export default function App() {
    return (
        <>
            <Header key="header" />
            <div id="main">
                <div id="page">
                    <BrowserRouter>
                        <Switch>
                            <Route exact path='/'>
                                <Home />
                            </Route>
                            <Route exact path='/Player'>
                                <Player />
                            </Route>
                            <Route exact path='/Listener'>
                                <Listener />
                            </Route>
                            <Route>
                                <NotFound />
                            </Route>
                        </Switch>
                    </BrowserRouter>
                </div>
            </div>
        </>
    );
}
