import { NextRequest, NextResponse } from 'next/server'
import { WORDS } from '@/app/data/words'

const WORD_LENGTH = 5

type AnswerCandidate = {
    answer: string;
    score: number;
    hit: number;
    present: number;
    needUpdate: boolean;
    needCheckTied: boolean;
};

type GameState = {
    candidates: AnswerCandidate[];
    guesses: string[];
    maxGuesses: number;
    isHardMode: boolean;
    normalWordle: boolean;
    gameOver: boolean;
    won: boolean;
};

const games: Map<string, GameState> = new Map()

/**
 * GET /api/singlePlayer/hostCheat
 * Returns the game id of the newly created game.
 * 
 * @param {number} optional maxGuesses - The maximum number of guesses allowed.
 * @param {boolean} optional isHardMode - Indicates if the game is in hard mode.
 * @returns {gameId: string} 
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const maxGuesses = parseInt(searchParams.get('maxGuesses') || '6', 10);
    const isHardMode = searchParams.get('isHardMode') === 'true'

    const gameId = Math.random().toString(36).substring(7);

    // if only one word, play like normal wordle
    const isNormalWordle = WORDS.length === 1;

    // Initialize candidates with zero scores
    const candidates: AnswerCandidate[] = WORDS.map(word => ({
        answer: word,
        score: 0,
        hit: 0,
        present: 0,
        needUpdate: true,
        needCheckTied: false,
    }));

    const newGame: GameState = {
        candidates,
        guesses: [],
        maxGuesses,
        isHardMode,
        normalWordle: isNormalWordle,
        gameOver: false,
        won: false,
    };

    games.set(gameId, newGame);
    return NextResponse.json({ gameId, newGame });
}

/**
 * POST /api/singlePlayer/hostCheat
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
    const { gameId, guess } = await request.json();
    const game = games.get(gameId);

    if (!game) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.gameOver) {
        return NextResponse.json({ error: 'Game is already over' }, { status: 400 });
    }

    if (guess.length !== WORD_LENGTH) {
        return NextResponse.json({ error: 'Invalid guess length' }, { status: 400 });
    }

    if (game.isHardMode && game.guesses.length > 0) {
        const lastGuessState = processGuess(game, game.guesses[game.guesses.length - 1]);
        if (!isValidHardModeGuess(guess, game.guesses[game.guesses.length - 1], lastGuessState)) {
            return NextResponse.json({ error: 'Invalid guess for hard mode' }, { status: 400 })
        }
    }

    if (!game.normalWordle) { updateCandidates(game, guess); }

    let result: string[];

    const tiedCandidates = getTiedCandidates(game.candidates);

    if (tiedCandidates.length > 0) {
        // play like normal wordle, sort candidates and put tiedCandidates on top
        // use the first candidate's answer as final
        // no more score update
        sortCandidates(game.candidates, tiedCandidates);
        result = processGuess(game, guess);
        game.normalWordle = true;
    } else if (game.candidates.length > 1) {

        const scores = game.candidates.map(c => c.score);
        const hits = game.candidates.map(c => c.hit);
        const presents = game.candidates.map(c => c.present);

        if (scores.some(s => s > 0) || hits.some(h => h > 0) || presents.some(p => p > 0)) {
            // If any candidate has hit or present > 0, mark as all "miss"
            result = Array(WORD_LENGTH).fill('miss');
        } else {
            // Only one candidate has hit and present == 0, process like a normal wordle
            // no more score update
            result = processGuess(game, guess);
            game.normalWordle = true;
        }
    } else {
        // Only one candidate in WORDS, process like a nomral wordle
        result = processGuess(game, guess);
        game.normalWordle = true;
    }

    game.guesses.push(guess);
    game.won = guess === game.candidates[0].answer;
    game.gameOver = game.guesses.length >= game.maxGuesses || game.won

    const response = {
        result,
        gameOver: game.gameOver,
        won: game.won,
        answer: game.gameOver ? game.candidates[0].answer : undefined
    };

    games.set(gameId, game);

    return NextResponse.json(response);
}

/**
 * Helper functions
 */
function processGuess(game: GameState, guess: string): string[] {
    const result: string[] = [];
    // Use the first candidate's answer to compare
    // Works if there is only one candidate
    const answerChars = game.candidates[0].answer.split('');
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

function updateCandidates(game: GameState, guess: string) {
    // Update scores of candidates
    game.candidates.forEach(c => {
        if (c.needCheckTied && !c.needUpdate) {
            c.needCheckTied = false;
        }
        if (c.needUpdate) {
            const candidateResult = processGuess(
                {
                    candidates: [c],
                    guesses: [],
                    maxGuesses: game.maxGuesses,
                    isHardMode: game.isHardMode,
                    normalWordle: false,
                    gameOver: false,
                    won: false
                },
                guess
            );

            const hitCount = candidateResult.filter(r => r === 'hit').length;
            const presentCount = candidateResult.filter(r => r === 'present').length;

            c.hit = hitCount;
            c.present = presentCount;
            c.score = hitCount + presentCount;

            // if needUpdate is false, meaning the candidate is 'eliminated' in the next round
            if (c.score > 0) {
                c.needUpdate = false;
                c.needCheckTied = true;
            }
        }
    });

    // Sort candidates by score(lowest to highest)
    // Sort for when only one zero score candidate and becomes normal wordle game
    game.candidates.sort((a, b) => {
        return a.score - b.score;
    })
}

function getTiedCandidates(candidates: AnswerCandidate[]): AnswerCandidate[] {
    const checkTiedCandidates = candidates.filter(c => c.needCheckTied);
    const zeroScoreCandidates = candidates.filter(c => c.score === 0);

    if (checkTiedCandidates.length === 0 || zeroScoreCandidates.length > 0) {
        return [];
    }

    // if only one candidate, return it to process like normal wordle
    if (checkTiedCandidates.length === 1) {
        return [checkTiedCandidates[0]];
    }

    let tiedCandidates: AnswerCandidate[] = [];
    let minHit = Infinity;
    let minPresent = Infinity;

    // compare and find if there are tied candidates
    // first compare hit, then present
    // if tied, push all to tiedCandidates
    for (const c of checkTiedCandidates) {
        if (c.hit < minHit) {
            minHit = c.hit;
            minPresent = c.present;
            tiedCandidates = [c];
        } else if (c.hit === minHit) {
            if (c.present < minPresent) {
                minPresent = c.present;
                tiedCandidates = [c];
            } else if (c.present === minPresent) {
                tiedCandidates.push(c);
            }
        }
    }
    return tiedCandidates;
}

function sortCandidates(candidates: AnswerCandidate[], tiedCandidates: AnswerCandidate[]): void {
    const tiedSet = new Set(tiedCandidates);

    candidates.sort((a, b) => {
        const isATied = tiedSet.has(a);
        const isBTied = tiedSet.has(b);

        if (isATied && !isBTied) {
            return -1;
        } else if (!isATied && isBTied) {
            return 1;
        }
        return 0;
    })
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