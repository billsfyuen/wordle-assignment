import React from "react";

const WORD_LENGTH = 5;

type GuessState = ("hit" | "present" | "miss" | "empty")[];

interface GameBoardProps {
  guesses: string[];
  currentGuess: string;
  guessIndex: number;
  guessStates: GuessState[];
  maxGuesses: number;
  isMultiplayer: boolean;
  gameOver: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
  guesses,
  currentGuess,
  guessIndex,
  guessStates,
  maxGuesses,
  isMultiplayer,
  gameOver,
}) => {
  const renderCell = (
    letter: string | undefined,
    state: GuessState[number]
  ) => {
    // hide letter if multiplayer mode and not game over
    const hiddenLetter = letter ? "*" : "";
    return (
      <div
        key={Math.random()} // random key for unique
        className={`w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold mr-2
          ${getCellStyles(state)}`}
      >
        {isMultiplayer && !gameOver ? hiddenLetter : letter}
      </div>
    );
  };

  const getCellStyles = (state: GuessState[number]) => {
    switch (state) {
      case "hit":
        return "bg-[var(--color-hit)] border-[var(--color-hit)] text-white";
      case "present":
        return "bg-[var(--color-present)] border-[var(--color-present)] text-white";
      case "miss":
        return "bg-[var(--color-miss)] border-[var(--color-miss)] text-white";
      default:
        return "bg-white text-black border-gray-300";
    }
  };

  return (
    <div className="mb-8 mx-4">
      {Array.from({ length: maxGuesses }).map((_, i) => {
        const isCurrentGuess = i === guessIndex;
        return (
          <div key={i} className="flex mb-2">
            {Array.from({ length: WORD_LENGTH }).map((_, j) => {
              const letter = isCurrentGuess ? currentGuess[j] : guesses[i]?.[j];
              const state = guessStates[i]?.[j] || "empty";
              return renderCell(letter, state);
            })}
          </div>
        );
      })}
    </div>
  );
};

export default GameBoard;
