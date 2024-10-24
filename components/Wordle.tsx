"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Keyboard from "./Keyboard";
import GameBoard from "./GameBoard";
import ConfigPopup from "./ConfigPopup";

// TODO: separte into a separate file
const WORDS = ["BILLY"];
const WORD_LENGTH = 5;

type GuessState = ("hit" | "present" | "miss" | "empty")[];

const Wordle: React.FC = () => {
  const [answer, setAnswer] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [guessIndex, setGuessIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [maxGuesses, setMaxGuesses] = useState(6);
  const { toast } = useToast();

  useEffect(() => {
    setAnswer(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }, []);

  const onKeyPress = useCallback(
    (key: string) => {
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

        const newGuesses = [...guesses];
        newGuesses[guessIndex] = currentGuess;
        setGuesses(newGuesses);
        setGuessIndex(guessIndex + 1);

        if (currentGuess === answer) {
          setWon(true);
          setGameOver(true);
        } else if (guessIndex === maxGuesses - 1) {
          //running out of max guesses
          setGameOver(true);
        }

        setCurrentGuess("");
      } else if (key === "BACKSPACE") {
        setCurrentGuess(currentGuess.slice(0, -1));
      } else if (currentGuess.length < WORD_LENGTH && /^[a-zA-Z]$/.test(key)) {
        setCurrentGuess(currentGuess + key);
      }
    },
    [currentGuess, gameOver, guessIndex, guesses, maxGuesses, answer, toast]
  );

  //handle keyboard input
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

  //check if each letter is a hit, present or miss
  const getGuessState = (guess: string): GuessState => {
    const state: GuessState = Array(WORD_LENGTH).fill("miss");
    const answerChars = answer.split("");

    // Check for hit letters
    guess.split("").forEach((letter, i) => {
      if (letter === answerChars[i]) {
        state[i] = "hit";
        answerChars[i] = "";
      }
    });

    // Check for present letters
    guess.split("").forEach((letter, i) => {
      if (state[i] !== "hit" && answerChars.includes(letter)) {
        state[i] = "present";
        //remove to avoid double counting
        answerChars[answerChars.indexOf(letter)] = "";
      }
    });

    return state;
  };

  const resetGame = () => {
    setAnswer(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuesses([]);
    setCurrentGuess("");
    setGuessIndex(0);
    setGameOver(false);
    setWon(false);
    setIsConfigOpen(true);
  };

  const handleConfigClose = (newMaxGuesses: number) => {
    setMaxGuesses(newMaxGuesses);
    setIsConfigOpen(false);
    setGuesses(Array(newMaxGuesses).fill(""));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Wordle</h1>
      <GameBoard
        guesses={guesses}
        currentGuess={currentGuess}
        guessIndex={guessIndex}
        getGuessState={getGuessState}
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
      <ConfigPopup isOpen={isConfigOpen} onClose={handleConfigClose} />
    </div>
  );
};

export default Wordle;
