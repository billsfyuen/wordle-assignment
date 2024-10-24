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

interface ConfigPopupProps {
  isOpen: boolean;
  onClose: (maxGuesses: number) => void;
}

const ConfigPopup: React.FC<ConfigPopupProps> = ({ isOpen, onClose }) => {
  const [maxGuesses, setMaxGuesses] = React.useState(6);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose(maxGuesses);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
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
          <Button type="submit">Start Game</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigPopup;
