import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConfigPopupProps {
  isOpen: boolean;
  onClose: (maxGuesses: number, gameMode: string) => void;
}

const ConfigPopup: React.FC<ConfigPopupProps> = ({ isOpen, onClose }) => {
  const [maxGuesses, setMaxGuesses] = React.useState(6);
  const [gameMode, setGameMode] = React.useState("normal");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose(maxGuesses, gameMode);
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Game Configuration</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="maxGuesses">Maximum Number of Guesses</Label>
            <Input
              id="maxGuesses"
              type="number"
              value={maxGuesses}
              onChange={(e) => setMaxGuesses(Number(e.target.value))}
              min={3}
              max={10}
            />
          </div>
          <div>
            <Label htmlFor="gameMode">Game Mode</Label>
            <Select value={gameMode} onValueChange={setGameMode}>
              <SelectTrigger>
                <SelectValue placeholder="Select a game mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="hostCheat">Host Cheat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">Start Game</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigPopup;
