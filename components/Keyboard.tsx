import React from "react";
import { Button } from "@/components/ui/button";

const KEYS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

type GuessState = "hit" | "present" | "miss" | "empty";

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  keyStates: Record<string, GuessState>;
  isMultiplayer: boolean;
  gameOver: boolean;
}

const Keyboard: React.FC<KeyboardProps> = ({
  onKeyPress,
  keyStates,
  isMultiplayer,
  gameOver,
}) => {
  const getKeyColor = (key: string) => {
    if (isMultiplayer && !gameOver) {
      //in multiplayer mode, keyboard not showing color state during game
      //only reveal color state after game over
      return "";
    } else {
      switch (keyStates[key]) {
        case "hit":
          return "bg-[var(--color-hit)] text-white border-[var(--color-hit)]";
        case "present":
          return "bg-[var(--color-present)] text-white border-[var(--color-present)]";
        case "miss":
          return "bg-[var(--color-miss)] text-white border-[var(--color-miss)]";
        default:
          return "";
      }
    }
  };

  return (
    <div>
      {KEYS.map((row, i) => (
        <div key={i} className="flex justify-center mb-2">
          {row.map((key) => (
            <Button
              key={key}
              onClick={() => onKeyPress(key)}
              className={`mx-1 ${
                key === "ENTER" || key === "BACKSPACE" ? "w-20" : "w-10"
              } ${getKeyColor(key)}`}
              variant="outline"
            >
              {key === "BACKSPACE" ? "←" : key}
            </Button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
