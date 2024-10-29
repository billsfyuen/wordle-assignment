# Wordle Clone

This is a Wordle clone project made by Bill YUEN, created for a job interview.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

To get started, first install the dependencies:

```bash
npm install
```

Next, start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the project.

## Features

This Wordle project utilizes the [Free Dictionary API](https://dictionaryapi.dev/) to verify if user inputs are valid English words. An internet connection is required to run this app.

The answers are chosen from a predefined list, which can be updated in _app/data/words.ts_.

> **Note:** Ensure that any new words added to the list exist in the [Free Dictionary API](https://dictionaryapi.dev/) before inclusion.

## Architecture

This application follows a Server/Client model. The server handles input validation, while the client does not have access to the answer until the user guesses correctly or the game ends.

## Game Modes

1. **Normal Mode:** The classic version inspired by the NY Times Wordle Game, where users can choose the maximum number of guesses.
2. **Hard Mode:** Also inspired by the NY Times Wordle Game, in which any revealed hints must be utilized in subsequent guesses.
3. **Host-Cheat Mode:** In this mode, the host does not select the answer at the start. Instead, they maintain a list of potential answers based on user input. The scoring system prioritizes more hits, with ties broken by the number of present letters. The candidate list is updated after each round to reflect the lowest scores from previous rounds.
4. **Multi-Player Mode:** Designed for two players, this mode allows them to share the same keyboard and take turns guessing the same word. Guesses remain hidden from each other, but hints (Hits or Presents) are provided. Players must memorize their own guesses.
   > **Note:** Multi-Player Mode can be played in Hard Mode, but is not available in Host-Cheat Mode.
5. **Infinite Mode:** This mode continues indefinitely until the user guesses the correct word. A scoring system is implemented: +3 points for Hits, +1 point for Presents, and -1 point for misses. Aim to achieve the highest score!
   > **Note:** Hard Mode is compatible with Infinite Mode, and it is recommended to play Infinite Mode with Hard Mode enabled.
