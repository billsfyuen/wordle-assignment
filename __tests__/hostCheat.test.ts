import { GET, POST } from '@/app/api/singlePlayer/hostCheat/route';

// Mocking WORDS array for testing
// This is to test the example case provided with assignment instructions.
jest.mock('../app/data/words', () => ({
    // word list for testing example 1
    WORDS: ["WORLD", "QUITE", "FANCY", "FRESH", "PANIC", "CRAZY", "BUGGY", "HELLO"],
}));

let gameId: string;
const exampleOneGuesses = ["HELLO", "WORLD", "FRESH", "CRAZY", "QUITE", "FANCY"];

describe('Host-Cheat Version API with example 1', () => {
    beforeAll(async () => {
        const response = await GET({ nextUrl: { searchParams: new URLSearchParams('') } });
        gameId = (await response.json()).gameId;
    });

    // first guess
    it('should return all misses on first guess', async () => {
        const response = await POST({
            json: () => ({ gameId, guess: exampleOneGuesses[0] }),
        });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.result).toEqual(['miss', 'miss', 'miss', 'miss', 'miss']);
        expect(body.gameOver).toBe(false);
        expect(body.won).toBe(false);
        expect(body.answer).toBeUndefined();
    });

    // second guess
    it('should return all misses on second guess', async () => {
        const response = await POST({
            json: () => ({ gameId, guess: exampleOneGuesses[1] }),
        });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.result).toEqual(['miss', 'miss', 'miss', 'miss', 'miss']);
        expect(body.gameOver).toBe(false);
        expect(body.won).toBe(false);
        expect(body.answer).toBeUndefined();
    });

    // third guess
    it('should return all misses on third guess', async () => {
        const response = await POST({
            json: () => ({ gameId, guess: exampleOneGuesses[2] }),
        });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.result).toEqual(['miss', 'miss', 'miss', 'miss', 'miss']);
        expect(body.gameOver).toBe(false);
        expect(body.won).toBe(false);
        expect(body.answer).toBeUndefined();
    });

    // forth guess
    it('should return two presents on forth guess', async () => {
        const response = await POST({
            json: () => ({ gameId, guess: exampleOneGuesses[3] }),
        });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.result).toEqual(['present', 'miss', 'present', 'miss', 'miss']);
        expect(body.gameOver).toBe(false);
        expect(body.won).toBe(false);
        expect(body.answer).toBeUndefined();
    });

    // fifth guess
    it('should return two present on fifth guess', async () => {
        const response = await POST({
            json: () => ({ gameId, guess: exampleOneGuesses[4] }),
        });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.result).toEqual(['miss', 'miss', 'present', 'miss', 'miss']);
        expect(body.gameOver).toBe(false);
        expect(body.won).toBe(false);
        expect(body.answer).toBeUndefined();
    });

    // sixth guess
    it('should lost on sixth guess', async () => {
        const response = await POST({
            json: () => ({ gameId, guess: exampleOneGuesses[5] }),
        });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.result).toEqual(['miss', 'hit', 'hit', 'present', 'miss']);
        expect(body.gameOver).toBe(true);
        expect(body.won).toBe(false);
        expect(body.answer).toBe("PANIC")
    });
});

jest.mock('../app/data/words', () => ({
    // word list for testing example 2
    WORDS: ["WORLD", "QUITE", "FANCY", "FRESH", "PANIC", "CRAZY", "BUGGY", "HELLO", "SCARE"],
}));

const exampleTwoGuesses = ["BUGGY", "SCARE", "WORLD"];

describe('Host-Cheat Version API with example 2', () => {
    beforeAll(async () => {
        const response = await GET({ nextUrl: { searchParams: new URLSearchParams('') } });
        gameId = (await response.json()).gameId;
    });

    // first guess
    it('should return all misses on first guess', async () => {
        const response = await POST({
            json: () => ({ gameId, guess: exampleTwoGuesses[0] }),
        });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.result).toEqual(['miss', 'miss', 'miss', 'miss', 'miss']);
        expect(body.gameOver).toBe(false);
        expect(body.won).toBe(false);
        expect(body.answer).toBeUndefined();
    });

    // second guess
    it('should return one present on second guess', async () => {
        const response = await POST({
            json: () => ({ gameId, guess: exampleTwoGuesses[1] }),
        });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.result).toEqual(['miss', 'miss', 'miss', 'present', 'miss']);
        expect(body.gameOver).toBe(false);
        expect(body.won).toBe(false);
        expect(body.answer).toBeUndefined();
    });

    // third guess
    it('should won on third guess', async () => {
        const response = await POST({
            json: () => ({ gameId, guess: exampleTwoGuesses[2] }),
        });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.result).toEqual(['hit', 'hit', 'hit', 'hit', 'hit']);
        expect(body.gameOver).toBe(true);
        expect(body.won).toBe(true);
        expect(body.answer).toBe("WORLD");
    });
});