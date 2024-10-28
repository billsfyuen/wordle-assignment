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
    normalWordle: boolean;
    gameOver: boolean;
    won: boolean;
};

const games: Map<string, GameState> = new Map()

/**
 * GET /api/cheat_mode
 * Returns the game id of the newly created game.
 * 
 * @returns {gameId: string} 
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const maxGuesses = parseInt(searchParams.get('maxGuesses') || '6', 10);

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
        normalWordle: isNormalWordle,
        gameOver: false,
        won: false,
    };

    games.set(gameId, newGame);
    return NextResponse.json({ gameId, newGame });
}

/**
 * POST /api/cheat_mode
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

    if (!game.normalWordle) { updateCandidates(game, guess); }

    let result: string[];

    const tiedCandidates = getTiedCandidates(game.candidates);

    if (tiedCandidates.length > 0) {
        // play like normal wordle, use the first candidate's answer as final
        // no more score update
        result = processGuess(game, guess);
        game.normalWordle = true;
    } else if (game.candidates.length > 1) {

        const scores = game.candidates.map(candidate => candidate.score);
        const hits = game.candidates.map(candidate => candidate.hit);
        const presents = game.candidates.map(candidate => candidate.present);

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
    game.candidates.forEach(candidate => {
        if (candidate.needCheckTied && !candidate.needUpdate) {
            candidate.needCheckTied = false;
        }
        if (candidate.needUpdate) {
            const candidateResult = processGuess(
                {
                    candidates: [candidate],
                    guesses: [],
                    maxGuesses: game.maxGuesses,
                    normalWordle: false,
                    gameOver: false,
                    won: false
                },
                guess
            );

            const hitCount = candidateResult.filter(r => r === 'hit').length;
            const presentCount = candidateResult.filter(r => r === 'present').length;

            candidate.hit = hitCount;
            candidate.present = presentCount;
            candidate.score = hitCount + presentCount;

            // if needUpdate is false, meaning the candidate is 'eliminated' in the next round
            if (candidate.score > 0) {
                candidate.needUpdate = false;
                candidate.needCheckTied = true;
            }
        }
    });

    // Sort candidates by score(lowest to highest)
    // If scores are tied, sort by hit count(highest to lowest)
    // Sort for when situtaiton becomes normal wordle game and to check tied candidates
    game.candidates.sort((a, b) => {
        if (a.score !== b.score) {
            return a.score - b.score;
        }
        return b.hit - a.hit;
    })
}

function getTiedCandidates(candidates: AnswerCandidate[]): AnswerCandidate[] {
    const tiedCandidates = candidates.filter(candidate => candidate.needCheckTied);

    if (tiedCandidates.length === 0) {
        return [];
    }

    // if only one candidate, return it to process like normal wordle
    if (tiedCandidates.length === 1) {
        return [tiedCandidates[0]];
    }

    // If there are exactly two candidates and both have scores > 0, compare directly
    if (tiedCandidates.length === 2 && (tiedCandidates[0].score > 0 || tiedCandidates[1].score > 0)) {
        const [first, second] = tiedCandidates;
        if (first.score < second.score) {
            return [first];
        } else if (second.score < first.score) {
            return [second];
        } else {
            return first.hit < second.hit ? [first] : [second];
        }
    }

    // Check for tie candidates for more than 2 candidates
    // Find the minimun hit and present values for canditates with score > 0
    const minHit = Math.min(...tiedCandidates.filter(candidate => candidate.score > 0).map(candidate => candidate.hit));
    const minPresent = Math.min(...tiedCandidates.filter(candidate => candidate.score > 0).map(candidate => candidate.present));

    return tiedCandidates.filter(candidate =>
        candidate.hit === minHit &&
        candidate.present === minPresent
    );
}