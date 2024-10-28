export async function checkWordExists(word: string): Promise<boolean> {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            return true;
        } else if (response.status === 404) {
            return false
        }
        return false;
    } catch (error) {
        return false;
    }
}