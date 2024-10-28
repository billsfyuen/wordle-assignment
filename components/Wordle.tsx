"use client";

import React, { useState } from "react";
import ConfigPopup from "./ConfigPopup";
import MultiplayerConfigPopup from "./MultiplayerConfigPopup";
import MultiPlayerWordle from "./MultiPlayerWordle";
import SinglePlayerWordle from "./SinglePlayerWordle";

const Wordle: React.FC = () => {
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [isMultiplayerConfigOpen, setIsMultiplayerConfigOpen] = useState(false);
  const [maxGuesses, setMaxGuesses] = useState(6);
  const [gameMode, setGameMode] = useState("normal");
  const [isMultiplayer, setIsMultiplayer] = useState(false);

  const handleConfigClose = (
    newMaxGuesses: number,
    newGameMode: string,
    newIsMultiplayer: boolean
  ) => {
    setMaxGuesses(newMaxGuesses);
    setGameMode(newGameMode);
    setIsMultiplayer(newIsMultiplayer);
    setIsConfigOpen(false);

    if (newIsMultiplayer) {
      setIsMultiplayerConfigOpen(true);
    }
  };

  const handleMultiplayerConfigClose = () => {
    setIsMultiplayerConfigOpen(false);
  };

  const handleGameEnd = () => {
    setIsConfigOpen(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <ConfigPopup isOpen={isConfigOpen} onClose={handleConfigClose} />
      <MultiplayerConfigPopup
        isOpen={isMultiplayerConfigOpen}
        onClose={handleMultiplayerConfigClose}
      />
      {!isConfigOpen &&
        !isMultiplayerConfigOpen &&
        (isMultiplayer ? (
          <MultiPlayerWordle
            maxGuesses={maxGuesses}
            onGameEnd={handleGameEnd}
          />
        ) : (
          <SinglePlayerWordle
            maxGuesses={maxGuesses}
            gameMode={gameMode}
            onGameEnd={handleGameEnd}
          />
        ))}
    </div>
  );
};

export default Wordle;
