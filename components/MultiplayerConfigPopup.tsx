import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MultiplayerConfigPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const MultiplayerConfigPopup: React.FC<MultiplayerConfigPopupProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Multiplayer Mode Rules</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>Welcome to Multiplayer Wordle! Here are the rules:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Two players will take turns guessing the same word.</li>
            <li>Each player has their own game board.</li>
            <li>Players share the same keyboard for input.</li>
            <li>
              Players cannot see their typed guesses during the game and must
              memorize them.
            </li>
            <li>
              The game ends when one player guesses the word correctly or both
              players run out of guesses.
            </li>
            <li>The player who guesses the word with fewer attempts wins.</li>
            <li>In case of a tie, the game ends in a draw.</li>
          </ul>
          <Button onClick={onClose}>Start Multiplayer Game</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MultiplayerConfigPopup;
