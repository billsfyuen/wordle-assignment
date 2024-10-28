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
  onClose: (
    maxGuesses: number,
    gameMode: string,
    isMultiplayer: boolean
  ) => void;
}

const ConfigPopup: React.FC<ConfigPopupProps> = ({ isOpen, onClose }) => {
  const [maxGuesses, setMaxGuesses] = React.useState(6);
  const [gameMode, setGameMode] = React.useState("normal");
  const [isMultiplayer, setIsMultiplayer] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose(maxGuesses, gameMode, isMultiplayer);
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
            <Select
              value={gameMode}
              onValueChange={(value) => {
                setGameMode(value);
                if (value === "hostCheat") {
                  setIsMultiplayer(false);
                }
              }}
              disabled={isMultiplayer}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a game mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="hostCheat">Host Cheat</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              Note: Host Cheat mode with multiplayer is currently not available.
            </p>
          </div>
          <div>
            <Label htmlFor="isMultiplayer">Player Mode</Label>
            <Select
              value={isMultiplayer ? "true" : "false"}
              onValueChange={(value) => {
                setIsMultiplayer(value === "true");
                if (value === "true") {
                  setGameMode("normal");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select multiplayer option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Single Player</SelectItem>
                <SelectItem value="true">Multiple Players</SelectItem>
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
