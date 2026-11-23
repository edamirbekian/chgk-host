import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Board } from './components/Board';
import { Host } from './components/Host';
import { handleSpotifyRedirect } from './spotify';
import './styles.css';

function App() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const onHash = () => setHash(location.hash);
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);
  return hash === '#board' ? <Board /> : <Host />;
}

handleSpotifyRedirect().finally(() => render(<App />, document.getElementById('app')!));
