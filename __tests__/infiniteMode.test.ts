import { GET, POST } from '@/app/api/infiniteMode/route';

jest.mock('../app/data/words', () => ({
    WORDS: ['WORLD'],
}));

let gameId: string;
const guessWithHitAndPresent = 'WORDS';

describe('Infinite Mode API', () => {
    beforeAll(async () => {
        const response = await GET({ nextUrl: { searchParams: new URLSearchParams('') } });
        gameId = (await response.json()).gameId;
    });

    it('should create a new game with GET /api/infiniteMode', async () => {
        const response = await GET({ nextUrl: { searchParams: new URLSearchParams('') } });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('gameId');
    });

    it('should return error for non-existent game in POST /api/singlePlayer/hostCheat', async () => {
        const response = await POST({
            json: () => ({ gameId: 'nonExistentId', guess: guessWithHitAndPresent }),
        });

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'Game not found' });
    });

    it('should return error for invalid guess length in POST /api/singlePlayer/hostCheat', async () => {
        const response = await POST({
            json: () => ({ gameId, guess: 'AP' }),
        });

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Invalid guess length' });
    });

    it('should return error for duplicate guess in POST /api/singlePlayer/hostCheat', async () => {
        await POST({
            json: () => ({ gameId, guess: guessWithHitAndPresent }),
        });

        const response = await POST({
            json: () => ({ gameId, guess: guessWithHitAndPresent }),
        });

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Duplicate guess' });
    });

    it('should return error for invalid guess in hard mode', async () => {
        const response = await POST({
            json: () => ({ gameId, guess: 'APPLE' }),
        });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.isCorrect).toBe(false);
    });

    it('should correctly process a valid guess in POST /api/singlePlayer/hostCheat', async () => {
        const response = await POST({
            json: () => ({ gameId, guess: "WORLD" }),
        });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.result).toEqual(['hit', 'hit', 'hit', 'hit', 'hit']);
        expect(body.isCorrect).toBe(true);
    });
});