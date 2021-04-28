import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import Home from './Home';
import Player from './Player';
import Listener from './Listener';
import NotFound from './NotFound';

if (document.getElementById('root')) {
    ReactDOM.render(
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
    , document.getElementById('root'));
}