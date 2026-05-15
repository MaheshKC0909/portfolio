import { useState } from 'react';
import Portfolio from './Portfolio';
import BinaryRunner from './BinaryRunner';

function App() {
  const [showGame, setShowGame] = useState(false);

  return (
    <div className="min-h-screen">
      {showGame ? (
        <BinaryRunner onEnter={() => setShowGame(false)} />
      ) : (
        <Portfolio />
      )}
    </div>
  )
}

export default App
