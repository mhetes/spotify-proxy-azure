import { Button, Classes, Text, H1 } from '@blueprintjs/core';
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
                    <div className={Classes.OVERLAY_SCROLL_CONTAINER}>aefef</div>
                    <H1>Heading</H1>
                    <Text className={Classes.LARGE}>sdsdsd</Text>
                    <Button icon="add" large intent="success" style={{width: 150, height: 80}}>Pridať</Button><br />
                    <Button icon="add" large intent="primary" style={{width: 150, height: 80}}>Detail</Button>
                SSSSS<br />
            SSSSS<br />
            SSSSS<br />
            SSSSS<br />
            SSSSS<br />
            SSSSS<br />
            SSSSS<br />
            SSSSS<br />
            SSSSS<br />
            SSSSS<br />
            SSSSS<br />
            SSSSS<br />
            XXXX<br />
            SSSSS<br />
            SSSSS<br />
            SSSSS<br />
            SSSSS<br />
            SSSSS<br />
            SSSSS<br />
            SSSS
            SSSSS<br />
            SSSSS<br />
            SSSSS<br />
            SSSSS<br />
                    </div>
                </div>

            
        </>
        
    );
}
/*
document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
        if (document.getElementById('root')) {
            ReactDOM.render(<App />, document.getElementById('root'));
        }
    }
}
*/