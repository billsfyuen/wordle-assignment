"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Keyboard from "./Keyboard";
import GameBoard from "./GameBoard";

// TODO: separte into a separate file
const WORDS = ["WORDS", "HELLO", "WORLD", "APPLE", "BILLY"];

const WORD_LENGTH = 5;

// TODO: allow users to change this
const MAX_GUESSES = 6;

type GuessState = ("hit" | "present" | "miss" | "empty")[];

const Wordle: React.FC = () => {
  const [solution, setSolution] = useState("");
  const [guesses, setGuesses] = useState<string[]>(Array(MAX_GUESSES).fill(""));
  const [currentGuess, setCurrentGuess] = useState("");
  const [guessIndex, setGuessIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSolution(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }, []);

  const onKeyPress = (key: string) => {
    if (gameOver) return;

    if (key === "ENTER") {
      if (currentGuess.length !== WORD_LENGTH) {
        toast({
          title: "Invalid word length",
          description: `Your guess must be ${WORD_LENGTH} letters long.`,
          variant: "destructive",
        });
        return;
      }

      const newGuesses = [...guesses];
      newGuesses[guessIndex] = currentGuess;
      setGuesses(newGuesses);
      setGuessIndex(guessIndex + 1);

      if (currentGuess === solution) {
        setWon(true);
        setGameOver(true);
      } else if (guessIndex === MAX_GUESSES - 1) {
        setGameOver(true);
      }

      setCurrentGuess("");
    } else if (key === "BACKSPACE") {
      setCurrentGuess(currentGuess.slice(0, -1));
    } else if (currentGuess.length < WORD_LENGTH) {
      setCurrentGuess(currentGuess + key);
    }
  };

  const getGuessState = (guess: string): GuessState => {
    const state: GuessState = Array(WORD_LENGTH).fill("miss");
    const solutionChars = solution.split("");

    // Check for correct letters
    guess.split("").forEach((letter, i) => {
      if (letter === solutionChars[i]) {
        state[i] = "hit";
        solutionChars[i] = "";
      }
    });

    // Check for present letters
    guess.split("").forEach((letter, i) => {
      if (state[i] !== "hit" && solutionChars.includes(letter)) {
        state[i] = "present";
        solutionChars[solutionChars.indexOf(letter)] = "";
      }
    });

    return state;
  };

  const resetGame = () => {
    setSolution(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuesses(Array(MAX_GUESSES).fill(""));
    setCurrentGuess("");
    setGuessIndex(0);
    setGameOver(false);
    setWon(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Wordle</h1>
      <GameBoard
        guesses={guesses}
        currentGuess={currentGuess}
        guessIndex={guessIndex}
        getGuessState={getGuessState}
      />
      <Keyboard onKeyPress={onKeyPress} />
      {gameOver && (
        <div className="mt-8 text-center">
          <p className="text-2xl font-bold mb-4">
            {won
              ? "Congratulations! You won!"
              : `Game Over. The word was ${solution}.`}
          </p>
          <Button onClick={resetGame}>Play Again</Button>
        </div>
      )}
    </div>
  );
};

export default Wordle;
