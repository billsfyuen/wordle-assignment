import { NextRequest, NextResponse } from 'next/server'
import { WORDS } from '@/app/data/words'

const WORD_LENGTH = 5

type GameState = {
    answer: string;
    guesses: string[];
    maxGuesses: number;
    isHardMode: boolean;
    gameOver: boolean;
    won: boolean;
}

const games: Map<string, GameState> = new Map()

/**
 * GET /api/wordle
 * Returns the game id of the newly created game.
 * 
 * @returns {gameId: string} 
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const maxGuesses = parseInt(searchParams.get('maxGuesses') || '6', 10)
    const isHardMode = searchParams.get('isHardMode') === 'true'

    const gameId = Math.random().toString(36).substring(7)
    const answer = WORDS[Math.floor(Math.random() * WORDS.length)]

    const newGame: GameState = {
        answer,
        maxGuesses,
        guesses: [],
        isHardMode,
        gameOver: false,
        won: false
    }
    games.set(gameId, newGame)
    return NextResponse.json({ gameId })
}

/**
 * POST /api/wordle
 * Updates the games data map and returns the result of the guess.
 * If game over or won, it includes the correct answer.
 * 
 * @param {string} gameId
 * @param {string} guess
 * @returns {Object}
 *   @property {Array<string>} result - "hit" | "present" | "miss"
 *   @property {boolean} gameOver - Indicates if the game has ended.
 *   @property {boolean} won - Indicates if the player has won.
 *   @property {string} answer - The correct answer if the game is over.
 */
export async function POST(request: NextRequest) {
    const { gameId, guess } = await request.json()
    const game = games.get(gameId)

    if (!game) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (game.gameOver) {
        return NextResponse.json({ error: 'Game is already over' }, { status: 400 })
    }

    if (guess.length !== WORD_LENGTH) {
        return NextResponse.json({ error: 'Invalid guess length' }, { status: 400 })
    }

    if (game.isHardMode && game.guesses.length > 0) {
        const lastGuessState = processGuess(game, game.guesses[game.guesses.length - 1]);
        if (!isValidHardModeGuess(guess, game.guesses[game.guesses.length - 1], lastGuessState)) {
            return NextResponse.json({ error: 'Invalid guess for hard mode' }, { status: 400 })
        }
    }

    const result = processGuess(game, guess);
    game.guesses.push(guess)
    game.won = guess === game.answer
    game.gameOver = game.guesses.length >= game.maxGuesses || game.won

    const response = {
        result,
        gameOver: game.gameOver,
        won: game.won,
        answer: game.gameOver ? game.answer : undefined
    }

    games.set(gameId, game)

    return NextResponse.json(response)
}

/**
 * Helper functions
 */
function processGuess(game: GameState, guess: string): string[] {
    const result: string[] = [];
    const answerChars = game.answer.split('');
    const guessChars = guess.split('');

    // Identify hits and mark spots to avoid double counting
    guessChars.forEach((letter: string, i: number) => {
        if (letter === answerChars[i]) {
            result[i] = 'hit';
            answerChars[i] = ''; // Mark as used
        } else {
            result[i] = 'miss';
        }
    });

    // Identify presents
    guessChars.forEach((letter: string, i: number) => {
        if (result[i] !== 'hit' && answerChars.includes(letter)) {
            result[i] = 'present';
            const index = answerChars.indexOf(letter);
            answerChars[index] = ''; // Mark as used
        }
    });

    return result;
}

function isValidHardModeGuess(guess: string, lastGuess: string, lastGuessState: string[]): boolean {
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (lastGuessState[i] === 'hit' && guess[i] !== lastGuess[i]) {
            return false;
        }
    }

    const presentLetters = lastGuess
        .split('')
        .filter((_, i) => lastGuessState[i] === 'present');
    for (const letter of presentLetters) {
        if (!guess.includes(letter)) {
            return false;
        }
    }

    return true;
}