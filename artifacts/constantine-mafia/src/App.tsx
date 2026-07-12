import React, { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ClerkProvider, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { dark } from '@clerk/themes';
import { GameEngine } from './game/GameEngine';
import { MainMenu } from './screens/MainMenu';
import { CharacterCreation } from './screens/CharacterCreation';
import { LoadingScreen } from './ui/LoadingScreen';
import { IntroScene } from './ui/IntroScene';
import { useGameStore } from './game/useGameStore';

const queryClient = new QueryClient();

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so the
// same build serves multiple Clerk custom domains. Do not inline the env var, leave
// publishableKey undefined, or replace publishableKeyFromHost with anything else.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — copy verbatim. Empty in dev (Clerk hits dev FAPI directly), auto-set
// in prod. Do NOT gate on import.meta.env.PROD / NODE_ENV — the empty dev value
// is intentional, and any branching breaks the prod proxy.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

// Clerk passes full paths to routerPush/routerReplace, but wouter's
// setLocation prepends the base — strip it to avoid doubling.
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: dark, // imported object from @clerk/themes; not a string
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#e6b800',
    colorBackground: '#0a0a0a',
    colorInput: '#1a1a1a',
    colorInputForeground: '#ffffff',
    colorForeground: '#ffffff',
    colorMutedForeground: '#9ca3af',
    colorNeutral: '#ffffff',
    colorDanger: '#ef4444',
    fontFamily: '"Exo 2", sans-serif',
    borderRadius: '0.5rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-black border border-white/10 rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-black px-4">
      {/* path must be the full browser path — Clerk reads window.location.pathname directly */}
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-black px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

// Helps the game's cached queries (e.g. cloud save) stay up-to-date when the
// signed-in user changes, by invalidating the QueryClient cache.
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function GameApp() {
  const screen   = useGameStore((s) => s.screen);
  const mapReady = useGameStore((s) => s.mapReady);

  // Show the intro cutscene once, immediately after character creation ends
  // and the game screen flips to 'playing'. Tracked in local state so it
  // never needs to touch the game store or survive a full session reset.
  const [showIntro, setShowIntro] = React.useState(false);
  const [introSeen, setIntroSeen] = React.useState(false);
  const prevScreen = React.useRef<string>(screen);

  React.useEffect(() => {
    if (prevScreen.current === 'character_creation' && screen === 'playing' && !introSeen) {
      setShowIntro(true);
      setIntroSeen(true);
    }
    prevScreen.current = screen;
  }, [screen, introSeen]);

  return (
    <div className="w-full h-[100dvh] bg-black overflow-hidden relative font-sans text-foreground">
      {screen === 'main_menu' && <MainMenu />}
      {screen === 'character_creation' && <CharacterCreation />}
      {/* GameEngine mounts immediately on 'playing' so the map streams in for
          real behind the scenes; LoadingScreen overlays it until mapReady
          flips true, then unmounts instantly — no black frame in between. */}
      {screen === 'playing' && <GameEngine />}
      {screen === 'playing' && !mapReady && <LoadingScreen />}
      {/* Intro cutscene — shown once after character creation, above the
          loading overlay (z-[70]) so it's visible while assets stream in. */}
      {showIntro && <IntroScene onDone={() => setShowIntro(false)} />}

      {/* Game Over Screen Overlay */}
      {screen === 'game_over' && (
        <div className="absolute inset-0 z-50 bg-red-950/90 flex flex-col items-center justify-center backdrop-blur-sm">
          <h1 className="text-7xl font-black text-red-500 mb-8 uppercase tracking-widest">WASTED</h1>
          <p className="text-xl text-white mb-8">You lost 20% of your money.</p>
          <button
            onClick={() => useGameStore.getState().setPlayerState({ screen: 'playing', health: 100, wantedLevel: 0, playerPosition: [310, 1, 0], mapLoadProgress: 0, mapReady: false })}
            className="px-10 py-4 bg-white text-black font-bold text-xl uppercase tracking-widest hover:bg-gray-200 rounded"
          >
            Respawn
          </button>
        </div>
      )}
    </div>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          {/* Home stays public — the game itself is playable signed-out with
              local-only saves; sign-in is only offered from Character Creation. */}
          <Route path="/" component={GameApp} />
          {/* REQUIRED — copy "/sign-in/*?" and "/sign-up/*?" verbatim. The /*? optional
              wildcard is the only wouter syntax that matches both the bare URL and Clerk's
              OAuth sub-paths. Not /sign-in, not /sign-in/*, not /sign-in/:rest*. */}
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route>
            <div className="min-h-screen bg-black text-white flex items-center justify-center">Route not found</div>
          </Route>
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
