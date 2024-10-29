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
  const [gameVersion, setGameVersion] = useState("normal");
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [isHardMode, setIsHardMode] = useState(false);

  const handleConfigClose = (
    newMaxGuesses: number,
    newGameVersion: string,
    newIsMultiplayer: boolean,
    newIsHardMode: boolean
  ) => {
    setMaxGuesses(newMaxGuesses);
    setGameVersion(newGameVersion);
    setIsMultiplayer(newIsMultiplayer);
    setIsHardMode(newIsHardMode);
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
            isHardMode={isHardMode}
            onGameEnd={handleGameEnd}
          />
        ) : (
          <SinglePlayerWordle
            maxGuesses={maxGuesses}
            gameVersion={gameVersion}
            isHardMode={isHardMode}
            onGameEnd={handleGameEnd}
          />
        ))}
    </div>
  );
};

export default Wordle;
