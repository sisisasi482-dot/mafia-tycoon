import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { GameEngine } from './game/GameEngine';
import { MainMenu } from './screens/MainMenu';
import { CharacterCreation } from './screens/CharacterCreation';
import { LoadingScreen } from './ui/LoadingScreen';
import { useGameStore } from './game/useGameStore';

const queryClient = new QueryClient();

function GameApp() {
  const screen = useGameStore((s) => s.screen);
  const mapReady = useGameStore((s) => s.mapReady);

  return (
    <div className="w-full h-[100dvh] bg-black overflow-hidden relative font-sans text-foreground">
      {screen === 'main_menu' && <MainMenu />}
      {screen === 'character_creation' && <CharacterCreation />}
      {/* GameEngine mounts immediately on 'playing' so the map streams in for
          real behind the scenes; LoadingScreen overlays it until mapReady
          flips true, then unmounts instantly — no black frame in between. */}
      {screen === 'playing' && <GameEngine />}
      {screen === 'playing' && !mapReady && <LoadingScreen />}
      
      {/* Game Over Screen Overlay */}
      {screen === 'game_over' && (
        <div className="absolute inset-0 z-50 bg-red-950/90 flex flex-col items-center justify-center backdrop-blur-sm">
          <h1 className="text-7xl font-black text-red-500 mb-8 uppercase tracking-widest">WASTED</h1>
          <p className="text-xl text-white mb-8">You lost 20% of your money.</p>
          <button 
            onClick={() => useGameStore.getState().setPlayerState({ screen: 'playing', health: 100, wantedLevel: 0, playerPosition: [-125, 1, 0], mapLoadProgress: 0, mapReady: false })}
            className="px-10 py-4 bg-white text-black font-bold text-xl uppercase tracking-widest hover:bg-gray-200 rounded"
          >
            Respawn
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Switch>
          <Route path="/" component={GameApp} />
          {/* Add a fallback just in case */}
          <Route>
            <div className="min-h-screen bg-black text-white flex items-center justify-center">Route not found</div>
          </Route>
        </Switch>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
