import { NextRequest, NextResponse } from 'next/server'
import { WORDS } from '@/app/data/words'

const WORD_LENGTH = 5

type PlayerState = {
    guesses: string[];
    guessResults: string[][];
}

type GameState = {
    answer: string;
    players: [PlayerState, PlayerState];
    maxGuesses: number;
    currentPlayer: 0 | 1;
    gameOver: boolean;
    winner: number | null;
}

const games: Map<string, GameState> = new Map()

/**
 * GET /api/multiPlayer
 * Returns the game id of the newly created multiplayer game.
 * 
 * @returns {gameId: string} 
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const maxGuesses = parseInt(searchParams.get('maxGuesses') || '6', 10)

    const gameId = Math.random().toString(36).substring(7)
    const answer = WORDS[Math.floor(Math.random() * WORDS.length)]

    const newGame: GameState = {
        answer,
        players: [
            { guesses: [], guessResults: [] },
            { guesses: [], guessResults: [] }
        ],
        maxGuesses,
        currentPlayer: 0,
        gameOver: false,
        winner: null
    }
    games.set(gameId, newGame)

    return NextResponse.json({ gameId })
}

/**
 * POST /api/multiPlayer
 * Updates the games data map and returns the result of the guess.
 * If game over or won, it includes the correct answer.
 * 
 * @param {string} gameId
 * @param {string} guess
 * @param {number} playerIndex
 * @returns {Object}
 *   @property {Array<string>} result - "hit" | "present" | "miss"
 *   @property {boolean} gameOver - Indicates if the game has ended.
 *   @property {number | null} winner - Index of the winning player, or null if no winner.
 *   @property {string} answer - The correct answer if the game is over.
 *   @property {number} nextPlayer - Index of the next player to make a guess.
 */
export async function POST(request: NextRequest) {
    const { gameId, guess, playerIndex } = await request.json()
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

    if (playerIndex !== game.currentPlayer) {
        return NextResponse.json({ error: 'Not your turn' }, { status: 400 })
    }

    const result = processGuess(game.answer, guess);
    game.players[playerIndex].guesses.push(guess)
    game.players[playerIndex].guessResults.push(result)

    const won = guess === game.answer

    if (won) {
        game.gameOver = true
        game.winner = playerIndex
    } else {
        // Check if both players have used all their guesses
        const allGuessesUsed = game.players.every(p => p.guesses.length >= game.maxGuesses)
        if (allGuessesUsed) {
            game.gameOver = true
        } else {
            // Switch to the other player
            game.currentPlayer = (game.currentPlayer + 1) % 2 as 0 | 1
        }
    }

    const response = {
        result,
        gameOver: game.gameOver,
        winner: game.winner,
        answer: game.gameOver ? game.answer : undefined,
        nextPlayer: game.currentPlayer
    }

    games.set(gameId, game)

    return NextResponse.json(response)
}

/**
 * Helper function
 */
function processGuess(answer: string, guess: string): string[] {
    const result: string[] = [];
    const answerChars = answer.split('');
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