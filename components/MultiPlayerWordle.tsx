"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Keyboard from "./Keyboard";
import GameBoard from "./GameBoard";
import { checkWordExists } from "@/utils/checkWordExists";

const WORD_LENGTH = 5;

type GuessState = ("hit" | "present" | "miss" | "empty")[];

interface MultiPlayerWordleProps {
  maxGuesses: number;
  isHardMode: boolean;
  onGameEnd: () => void;
}

const MultiPlayerWordle: React.FC<MultiPlayerWordleProps> = ({
  maxGuesses,
  isHardMode,
  onGameEnd,
}) => {
  const { toast } = useToast();
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerAGuesses, setplayerAGuesses] = useState<string[]>([]);
  const [playerBGuesses, setplayerBGuesses] = useState<string[]>([]);
  const [playerAGuessesStates, setplayerAGuessesStates] = useState<
    GuessState[]
  >([]);
  const [playerBGuessesStates, setplayerBGuessesStates] = useState<
    GuessState[]
  >([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [keyStates, setKeyStates] = useState<
    Record<string, GuessState[number]>
  >({});

  /**
   * Game Initialization
   */
  const startNewGame = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/multiPlayer?maxGuesses=${maxGuesses}&isHardMode=${isHardMode}`,
        {
          method: "GET",
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      resetGame(data.gameId);
    } catch {
      toast({
        title: "Error",
        description: "Failed to start a new game. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, maxGuesses, isHardMode]);

  const resetGame = (gameId: string) => {
    setGameId(gameId);
    setplayerAGuesses([]);
    setplayerBGuesses([]);
    setplayerAGuessesStates([]);
    setplayerBGuessesStates([]);
    setCurrentGuess("");
    setGameOver(false);
    setWinner(null);
    setAnswer(null);
    setCurrentPlayer(0);
    setKeyStates({});
  };

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  /**
   * Key State Management
   */
  const updateKeyStates = (currentGuess: string, result: GuessState) => {
    const newKeyStates = { ...keyStates };
    currentGuess.split("").forEach((letter, index) => {
      const state = result[index];
      if (
        state === "hit" ||
        (state === "present" && newKeyStates[letter] !== "hit")
      ) {
        newKeyStates[letter] = state;
      } else if (state === "miss" && !newKeyStates[letter]) {
        newKeyStates[letter] = "miss";
      }
    });
    setKeyStates(newKeyStates);
  };

  /**
   * Guess Submission
   */
  const handleGuessSubmission = async () => {
    if (currentGuess.length !== WORD_LENGTH) {
      toast({
        title: "Invalid word length",
        description: `Your guess must be ${WORD_LENGTH} letters long.`,
        variant: "destructive",
      });
      return;
    }

    if (!(await checkWordExists(currentGuess))) {
      toast({
        title: "Invalid word",
        description: `Your guess must be an English word.`,
        variant: "destructive",
      });
      return;
    }

    if (!isValidHardModeGuess(currentGuess)) {
      return;
    }

    try {
      const response = await fetch(`/api/multiPlayer`, {
        method: "POST",
        body: JSON.stringify({
          gameId,
          guess: currentGuess,
          playerIndex: currentPlayer,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      if (response.ok) {
        updatePlayerGuesses(data.result);
        setCurrentGuess("");
        setCurrentPlayer(data.nextPlayer);
        setGameOver(data.gameOver);
        setWinner(data.winner);

        if (data.gameOver) {
          setAnswer(data.answer);
        }

        updateKeyStates(currentGuess, data.result);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit guess. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updatePlayerGuesses = (result: GuessState) => {
    const newGuesses =
      currentPlayer === 0
        ? [...playerAGuesses, currentGuess]
        : [...playerBGuesses, currentGuess];
    const newGuessStates =
      currentPlayer === 0
        ? [...playerAGuessesStates, result]
        : [...playerBGuessesStates, result];

    if (currentPlayer === 0) {
      setplayerAGuesses(newGuesses);
      setplayerAGuessesStates(newGuessStates);
    } else {
      setplayerBGuesses(newGuesses);
      setplayerBGuessesStates(newGuessStates);
    }
  };

  /**
   * Validate Hard Mode Guess
   */
  const isValidHardModeGuess = (guess: string): boolean => {
    if (!isHardMode) {
      return true;
    }

    const currentPlayerGuesses =
      currentPlayer === 0 ? playerAGuesses : playerBGuesses;
    const currentPlayerGuessStates =
      currentPlayer === 0 ? playerAGuessesStates : playerBGuessesStates;

    if (currentPlayerGuesses.length === 0) {
      return true;
    }

    const lastGuess = currentPlayerGuesses[currentPlayerGuesses.length - 1];
    const lastGuessState =
      currentPlayerGuessStates[currentPlayerGuessStates.length - 1];

    for (let i = 0; i < WORD_LENGTH; i++) {
      if (lastGuessState[i] === "hit" && guess[i] !== lastGuess[i]) {
        toast({
          title: "Invalid guess (HARD mode)",
          description: `Letter * must be in position ${i + 1}.`,
          variant: "destructive",
        });
        return false;
      }
    }

    const presentLetters = lastGuess
      .split("")
      .filter((_, i) => lastGuessState[i] === "present");
    for (const letter of presentLetters) {
      if (!guess.includes(letter)) {
        toast({
          title: "Invalid guess (HARD mode)",
          description: `Guess must include the letter *.`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  /**
   * (Keyboard) Input Handling
   */
  const onKeyPress = useCallback(
    async (key: string) => {
      if (gameOver || !gameId) return;

      if (key === "ENTER") {
        await handleGuessSubmission();
      } else if (key === "BACKSPACE") {
        setCurrentGuess(currentGuess.slice(0, -1));
      } else if (currentGuess.length < WORD_LENGTH && /^[a-zA-Z]$/.test(key)) {
        setCurrentGuess(currentGuess + key);
      }
    },
    [gameId, currentGuess, gameOver, handleGuessSubmission]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === "Enter") {
        onKeyPress("ENTER");
      } else if (event.key === "Backspace") {
        onKeyPress("BACKSPACE");
      } else {
        const key = event.key.toUpperCase();
        if (/^[A-Z]$/.test(key)) {
          onKeyPress(key);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onKeyPress]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Multiplayer Wordle</h1>
      <div className="flex justify-center space-x-8 mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Player 1</h2>
          <GameBoard
            guesses={playerAGuesses}
            currentGuess={currentPlayer === 0 ? currentGuess : ""}
            guessIndex={playerAGuesses.length}
            guessStates={playerAGuessesStates}
            maxGuesses={maxGuesses}
            isMultiplayer={true}
            gameOver={gameOver}
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Player 2</h2>
          <GameBoard
            guesses={playerBGuesses}
            currentGuess={currentPlayer === 1 ? currentGuess : ""}
            guessIndex={playerBGuesses.length}
            guessStates={playerBGuessesStates}
            maxGuesses={maxGuesses}
            isMultiplayer={true}
            gameOver={gameOver}
          />
        </div>
      </div>
      <Keyboard
        onKeyPress={onKeyPress}
        keyStates={keyStates}
        isMultiplayer={true}
        gameOver={gameOver}
      />
      {gameOver && (
        <div className="mt-8 text-center">
          <p className="text-2xl font-bold mb-4">
            {winner !== null
              ? `Player ${winner + 1} wins! The word was ${answer}.`
              : `Tied! The word was ${answer}.`}
          </p>
          <Button onClick={onGameEnd}>Back to Main Menu</Button>
        </div>
      )}
      <p className="mt-4 text-xl font-bold">
        {gameOver ? "Game Over" : `Current Turn: Player ${currentPlayer + 1}`}
      </p>
    </div>
  );
};

export default MultiPlayerWordle;
