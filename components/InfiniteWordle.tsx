"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Keyboard from "./Keyboard";
import GameBoard from "./GameBoard";
import { checkWordExists } from "@/utils/checkWordExists";

const WORD_LENGTH = 5;
const INITIAL_MAX_GUESSES = 6;

type GuessState = ("hit" | "present" | "miss" | "empty")[];

interface InfiniteWordleProps {
  onGameEnd: () => void;
  isHardMode: boolean;
}

// 3 points for hit, 1 point for present, -1 point for miss
const InfiniteWordle: React.FC<InfiniteWordleProps> = ({
  onGameEnd,
  isHardMode,
}) => {
  const gameBoardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [gameId, setGameId] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [guessStates, setGuessStates] = useState<GuessState[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [score, setScore] = useState(0);
  const [hitCount, setHitCount] = useState(0);
  const [presentCount, setPresentCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [maxGuesses, setMaxGuesses] = useState(INITIAL_MAX_GUESSES);
  const [keyStates, setKeyStates] = useState<
    Record<string, GuessState[number]>
  >({});
  const [gameOver, setGameOver] = useState(false);

  /**
   * Game Initialization
   */
  const startNewGame = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/infiniteMode?isHardMode=${isHardMode}`,
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
  }, [toast, isHardMode]);

  const resetGame = (gameId: string) => {
    setGameId(gameId);
    setGuesses([]);
    setGuessStates([]);
    setCurrentGuess("");
    setScore(0);
    setHitCount(0);
    setPresentCount(0);
    setMissCount(0);
    setMaxGuesses(INITIAL_MAX_GUESSES);
    setKeyStates({});
    setGameOver(false);
  };

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  useEffect(() => {
    if (gameBoardRef.current) {
      gameBoardRef.current.scrollTop = gameBoardRef.current.scrollHeight;
    }
  }, [gameBoardRef, guesses]);

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

    // check if guess are duplicate (only in infinte mode)
    if (guesses.includes(currentGuess)) {
      toast({
        title: "Duplicate guess",
        description: "You've already guessed this word.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidHardModeGuess(currentGuess)) {
      return;
    }

    try {
      const response = await fetch("/api/infiniteMode", {
        method: "POST",
        body: JSON.stringify({ gameId, guess: currentGuess }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      if (response.ok) {
        setGuesses([...guesses, currentGuess]);
        setGuessStates([...guessStates, data.result]);
        setCurrentGuess("");
        updateKeyStates(currentGuess, data.result);
        setScore(data.score);
        setHitCount(data.hitCount);
        setPresentCount(data.presentCount);
        setMissCount(data.missCount);

        if (guesses.length + 1 >= maxGuesses) {
          setMaxGuesses(maxGuesses + 1);
        }

        if (data.isCorrect) {
          setGameOver(true);
          toast({
            title: "Congratulations!",
            description: `You guessed the word correctly! Your final score is ${data.score}.`,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit guess. Please try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Validate Hard Mode Guess
   */
  const isValidHardModeGuess = (guess: string): boolean => {
    if (!isHardMode || guesses.length === 0) {
      return true;
    }

    const lastGuessState = guessStates[guessStates.length - 1];
    const lastGuess = guesses[guesses.length - 1];

    for (let i = 0; i < WORD_LENGTH; i++) {
      if (lastGuessState[i] === "hit" && guess[i] !== lastGuess[i]) {
        toast({
          title: "Invalid guess (HARD mode)",
          description: `Letter ${lastGuess[
            i
          ].toUpperCase()} must be in position ${i + 1}.`,
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
          description: `Guess must include the letter ${letter.toUpperCase()}.`,
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
      if (!gameId || gameOver) return;

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
      <h1 className="text-4xl font-bold mb-8">Infinite Wordle</h1>
      <div className="text-2xl font-bold mb-4">Score: {score}</div>
      <div className="text-lg mb-4">
        <span className="mr-4">Hits: {hitCount}</span>
        <span className="mr-4">Present: {presentCount}</span>
        <span>Misses: {missCount}</span>
      </div>
      <div ref={gameBoardRef} className="max-h-[60vh] overflow-y-auto mb-4">
        <GameBoard
          guesses={guesses}
          currentGuess={currentGuess}
          guessIndex={guesses.length}
          guessStates={guessStates}
          maxGuesses={maxGuesses}
          isMultiplayer={false}
          gameOver={gameOver}
        />
      </div>
      <Keyboard
        onKeyPress={onKeyPress}
        keyStates={keyStates}
        isMultiplayer={false}
        gameOver={gameOver}
      />
      {gameOver && (
        <Button onClick={onGameEnd} className="mt-8">
          Back to Main Menu
        </Button>
      )}
      {isHardMode && (
        <p className="mt-2 text-sm text-muted-foreground">
          Hard Mode - You must use revealed hints in subsequent guesses.
        </p>
      )}
    </div>
  );
};

export default InfiniteWordle;
