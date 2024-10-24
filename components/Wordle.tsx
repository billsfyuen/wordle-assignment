"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Keyboard from "./Keyboard";
import GameBoard from "./GameBoard";
import ConfigPopup from "./ConfigPopup";

const WORD_LENGTH = 5;

type GuessState = ("hit" | "present" | "miss" | "empty")[];

const Wordle: React.FC = () => {
  const { toast } = useToast();

  const [gameId, setGameId] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [guessStates, setGuessStates] = useState<GuessState[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [maxGuesses, setMaxGuesses] = useState(6);

  const startNewGame = useCallback(async () => {
    try {
      const response = await fetch(`/api/wordle?maxGuesses=${maxGuesses}`, {
        method: "GET",
      });
      const data = await response.json();

      setGameId(data.gameId);
      setGuesses([]);
      setGuessStates([]);
      setCurrentGuess("");
      setGameOver(false);
      setWon(false);
      setAnswer(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start a new game. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, maxGuesses]);

  useEffect(() => {
    if (!isConfigOpen) {
      startNewGame();
    }
  }, [isConfigOpen, startNewGame]);

  const onKeyPress = useCallback(
    async (key: string) => {
      if (gameOver) return;

      if (key === "ENTER") {
        //check if the guess contains 5 letters
        if (currentGuess.length !== WORD_LENGTH) {
          toast({
            title: "Invalid word length",
            description: `Your guess must be ${WORD_LENGTH} letters long.`,
            variant: "destructive",
          });
          return;
        }

        try {
          const response = await fetch("/api/wordle", {
            method: "POST",
            body: JSON.stringify({ gameId, guess: currentGuess }),
            headers: { "Content-Type": "application/json" },
          });
          const data = await response.json();

          if (response.ok) {
            setGuesses([...guesses, currentGuess]);
            setGuessStates([...guessStates, data.result]);

            setCurrentGuess("");

            setGameOver(data.gameOver);
            setWon(data.won);
            if (data.gameOver) {
              setAnswer(data.answer);
            }
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
      } else if (key === "BACKSPACE") {
        setCurrentGuess(currentGuess.slice(0, -1));
      } else if (currentGuess.length < WORD_LENGTH && /^[a-zA-Z]$/.test(key)) {
        setCurrentGuess(currentGuess + key);
      }
    },
    [currentGuess, gameOver, guesses, maxGuesses, answer, toast]
  );

  //handle keyboard input
  //TODO: avoid hit enter at config toast
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

  const handleConfigClose = (newMaxGuesses: number) => {
    setMaxGuesses(newMaxGuesses);
    setIsConfigOpen(false);
  };

  const resetGame = () => {
    setIsConfigOpen(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <ConfigPopup isOpen={isConfigOpen} onClose={handleConfigClose} />
      <h1 className="text-4xl font-bold mb-8">Wordle</h1>
      <GameBoard
        guesses={guesses}
        currentGuess={currentGuess}
        guessIndex={guesses.length}
        guessStates={guessStates}
        maxGuesses={maxGuesses}
      />
      <Keyboard onKeyPress={onKeyPress} />
      {gameOver && (
        <div className="mt-8 text-center">
          <p className="text-2xl font-bold mb-4">
            {won
              ? "Congratulations! You won!"
              : `Game Over. The word was ${answer}.`}
          </p>
          <Button onClick={resetGame}>Play Again</Button>
        </div>
      )}
    </div>
  );
};

export default Wordle;
