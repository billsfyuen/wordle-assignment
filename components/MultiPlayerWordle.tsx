"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Keyboard from "./Keyboard";
import GameBoard from "./GameBoard";

const WORD_LENGTH = 5;

type GuessState = ("hit" | "present" | "miss" | "empty")[];

interface MultiPlayerWordleProps {
  maxGuesses: number;
  onGameEnd: () => void;
}

const MultiPlayerWordle: React.FC<MultiPlayerWordleProps> = ({
  maxGuesses,
  onGameEnd,
}) => {
  const { toast } = useToast();

  const [gameId, setGameId] = useState<string | null>(null);
  const [guesses1, setGuesses1] = useState<string[]>([]);
  const [guesses2, setGuesses2] = useState<string[]>([]);
  const [guessStates1, setGuessStates1] = useState<GuessState[]>([]);
  const [guessStates2, setGuessStates2] = useState<GuessState[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [keyStates, setKeyStates] = useState<
    Record<string, GuessState[number]>
  >({});

  const startNewGame = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/multiPlayer?maxGuesses=${maxGuesses}`,
        {
          method: "GET",
        }
      );
      const data = await response.json();

      setGameId(data.gameId);
      setGuesses1([]);
      setGuesses2([]);
      setGuessStates1([]);
      setGuessStates2([]);
      setCurrentGuess("");
      setGameOver(false);
      setWinner(null);
      setAnswer(null);
      setCurrentPlayer(0);
      setKeyStates({});
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start a new game. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, maxGuesses]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const onKeyPress = useCallback(
    async (key: string) => {
      if (gameOver || !gameId) return;

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

          if (response.ok) {
            const newGuesses =
              currentPlayer === 1
                ? [...guesses1, currentGuess]
                : [...guesses2, currentGuess];
            const newGuessStates =
              currentPlayer === 1
                ? [...guessStates1, data.result]
                : [...guessStates2, data.result];

            if (currentPlayer === 0) {
              setGuesses1(newGuesses);
              setGuessStates1(newGuessStates);
            } else {
              setGuesses2(newGuesses);
              setGuessStates2(newGuessStates);
            }

            setCurrentGuess("");
            setCurrentPlayer(data.nextPlayer);
            setGameOver(data.gameOver);
            setWinner(data.winner);

            if (data.gameOver) {
              setAnswer(data.answer);
            }

            const newKeyStates = { ...keyStates };
            currentGuess.split("").forEach((letter, index) => {
              const state = data.result[index];
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
    [
      currentPlayer,
      gameId,
      currentGuess,
      gameOver,
      guesses1,
      guesses2,
      guessStates1,
      guessStates2,
      maxGuesses,
      keyStates,
      toast,
    ]
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
            guesses={guesses1}
            currentGuess={currentPlayer === 0 ? currentGuess : ""}
            guessIndex={guesses1.length}
            guessStates={guessStates1}
            maxGuesses={maxGuesses}
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Player 2</h2>
          <GameBoard
            guesses={guesses2}
            currentGuess={currentPlayer === 1 ? currentGuess : ""}
            guessIndex={guesses2.length}
            guessStates={guessStates2}
            maxGuesses={maxGuesses}
          />
        </div>
      </div>
      <Keyboard onKeyPress={onKeyPress} keyStates={keyStates} />
      {gameOver && (
        <div className="mt-8 text-center">
          <p className="text-2xl font-bold mb-4">
            {winner
              ? `Player ${winner + 1} wins! The word was ${answer}.`
              : `Game Over. The word was ${answer}.`}
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
