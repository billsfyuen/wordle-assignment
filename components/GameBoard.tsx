import React from "react";

const WORD_LENGTH = 5;

type GuessState = ("hit" | "present" | "miss" | "empty")[];

interface GameBoardProps {
  guesses: string[];
  currentGuess: string;
  guessIndex: number;
  guessStates: GuessState[];
  maxGuesses: number;
}

const GameBoard: React.FC<GameBoardProps> = ({
  guesses,
  currentGuess,
  guessIndex,
  guessStates,
  maxGuesses,
}) => {
  return (
    <div className="mb-8">
      {Array.from({ length: maxGuesses }).map((_, i) => (
        <div key={i} className="flex mb-2">
          {Array.from({ length: WORD_LENGTH }).map((_, j) => {
            //fill the letter and state into the cell
            const letter = i === guessIndex ? currentGuess[j] : guesses[i]?.[j];
            const state = guessStates[i]?.[j] || "empty";
            return (
              <div
                key={j}
                className={`w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold mr-2
                  ${
                    state === "hit"
                      ? "bg-[var(--color-hit)] border-[var(--color-hit)] text-white "
                      : state === "present"
                      ? "bg-[var(--color-present)] text-white border-[var(--color-present)]"
                      : state === "miss"
                      ? "bg-[var(--color-miss)] text-white border-[var(--color-miss)]"
                      : "bg-white text-black border-gray-300"
                  }`}
              >
                {letter}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default GameBoard;
