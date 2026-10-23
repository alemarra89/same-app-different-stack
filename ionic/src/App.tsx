import { IonApp, setupIonicReact } from '@ionic/react';
import Home from './pages/Home';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import './theme/variables.css';

setupIonicReact();
export default function App() {
  return <IonApp><Home /></IonApp>;
}
