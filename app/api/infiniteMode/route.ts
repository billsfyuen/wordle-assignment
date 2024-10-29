import { NextRequest, NextResponse } from 'next/server'
import { WORDS } from '@/app/data/words'

const WORD_LENGTH = 5

type GameState = {
    answer: string;
    guesses: string[];
    isHardMode: boolean;
    hitCount: number;
    presentCount: number;
    missCount: number;
    score: number;
}

const games: Map<string, GameState> = new Map()

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const isHardMode = searchParams.get('isHardMode') === 'true'

    const gameId = Math.random().toString(36).substring(7)
    const answer = WORDS[Math.floor(Math.random() * WORDS.length)]

    const newGame: GameState = {
        answer,
        guesses: [],
        isHardMode,
        hitCount: 0,
        presentCount: 0,
        missCount: 0,
        score: 0,
    }
    games.set(gameId, newGame)
    return NextResponse.json({ gameId })
}

export async function POST(request: NextRequest) {
    const { gameId, guess } = await request.json()
    const game = games.get(gameId)

    if (!game) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (guess.length !== WORD_LENGTH) {
        return NextResponse.json({ error: 'Invalid guess length' }, { status: 400 })
    }

    if (game.guesses.includes(guess)) {
        return NextResponse.json({ error: 'Duplicate guess' }, { status: 400 })
    }

    if (game.isHardMode && game.guesses.length > 0) {
        const lastGuessResult = processGuess(game.answer, game.guesses[game.guesses.length - 1]);
        if (!isValidHardModeGuess(guess, game.guesses[game.guesses.length - 1], lastGuessResult)) {
            return NextResponse.json({ error: 'Invalid guess for hard mode' }, { status: 400 })
        }
    }

    const result = processGuess(game.answer, guess);

    game.guesses.push(guess)

    processScore(game, result)

    const isCorrect = guess === game.answer

    games.set(gameId, game)

    return NextResponse.json({
        result,
        isCorrect,
        hitCount: game.hitCount,
        presentCount: game.presentCount,
        missCount: game.missCount,
        score: game.score
    })
}

function processGuess(answer: string, guess: string): string[] {
    const result: string[] = [];
    const answerChars = answer.split('');
    const guessChars = guess.split('');

    guessChars.forEach((letter: string, i: number) => {
        if (letter === answerChars[i]) {
            result[i] = 'hit';
            answerChars[i] = '';
        } else {
            result[i] = 'miss';
        }
    });

    guessChars.forEach((letter: string, i: number) => {
        if (result[i] !== 'hit' && answerChars.includes(letter)) {
            result[i] = 'present';
            const index = answerChars.indexOf(letter);
            answerChars[index] = '';
        }
    });

    return result;
}

function isValidHardModeGuess(guess: string, lastGuess: string, lastGuessResult: string[]): boolean {
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (lastGuessResult[i] === 'hit' && guess[i] !== lastGuess[i]) {
            return false;
        }
    }

    const presentLetters = lastGuess
        .split('')
        .filter((_, i) => lastGuessResult[i] === 'present');
    for (const letter of presentLetters) {
        if (!guess.includes(letter)) {
            return false;
        }
    }

    return true;
}

function processScore(game: GameState, result: string[]) {
    const newHitCount = result.filter((r) => r === 'hit').length;
    const newPresentCount = result.filter((r) => r === 'present').length;
    const newMissCount = result.filter((r) => r === "miss").length;

    game.hitCount += newHitCount;
    game.presentCount += newPresentCount;
    game.missCount += newMissCount;

    game.score += newHitCount * 3 + newPresentCount;
    game.score -= newMissCount
}