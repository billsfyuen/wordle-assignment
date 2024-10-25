import Wordle from "@/components/Wordle";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  return (
    <main>
      <Wordle />
      <Toaster />
    </main>
  );
}
