import React from "react";

const WORD_LENGTH = 5;

// type GuessState = ("hit" | "present" | "miss" | "empty")[];

interface GameBoardProps {
  guesses: string[];
  currentGuess: string;
  guessIndex: number;
  getGuessState: (guess: string) => GuessState;
}

const GameBoard: React.FC<GameBoardProps> = ({
  guesses,
  currentGuess,
  guessIndex,
  getGuessState,
}) => {
  return (
    <div className="mb-8">
      {guesses.map((guess, i) => (
        <div key={i} className="flex mb-2">
          {Array.from({ length: WORD_LENGTH }).map((_, j) => {
            const letter = i === guessIndex ? currentGuess[j] : guess[j];
            const state = i < guessIndex ? getGuessState(guess)[j] : "empty";
            return (
              <div
                key={j}
                className={`w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold mr-2
                  ${
                    state === "hit"
                      ? "bg-green-500 text-white border-green-500"
                      : state === "present"
                      ? "bg-yellow-500 text-white border-yellow-500"
                      : state === "miss"
                      ? "bg-gray-500 text-white border-gray-500"
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
