"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import LoadingScreen from "../components/LoadingScreen";
import HomePage from "../components/HomePage";

const AsteroidSerpent = dynamic(() => import("../components/AsteroidSerpent"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function Home() {
  const [showGame, setShowGame] = useState(false);
  const [challengeMode, setChallengeMode] = useState(false);
  const [inputMode, setInputMode] = useState("keyboard");

  if (showGame) {
    return <AsteroidSerpent 
      initialChallengeMode={challengeMode} 
      initialInputMode={inputMode}
      onExit={() => setShowGame(false)}
    />;
  }

  return (
    <HomePage 
      onStartGame={() => setShowGame(true)}
      challengeMode={challengeMode}
      onToggleChallengeMode={() => setChallengeMode(!challengeMode)}
      inputMode={inputMode}
      onSetInputMode={setInputMode}
    />
  );
}
