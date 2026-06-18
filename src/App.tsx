import { useState } from 'react';
import Carousel from './components/Carousel';
import Game from './components/Game';

function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');

  const handlePlay = (characterImage: string) => {
    setSelectedCharacter(characterImage);
    setGameState('playing');
  };

  const handleExitGame = () => {
    setGameState('menu');
  };

  return (
    <div className="w-full h-screen bg-black">
      {gameState === 'menu' ? (
        <Carousel onPlay={handlePlay} />
      ) : (
        <Game characterImage={selectedCharacter} onExit={handleExitGame} />
      )}
    </div>
  );
}

export default App;
