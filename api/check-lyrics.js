import fetch from 'node-fetch';
import cheerio from 'cheerio'; // Librería para scraping

async function getLyricsFromUrl(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);
        const lyrics = $('.Lyrics__Container-sc-1ynbvzw-6').text(); // Selector CSS para letras en Genius
        return lyrics || null;
    } catch (error) {
        console.error('Error al obtener la letra:', error);
        return null;
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    const { lyrics, word } = req.body;
    const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;

    if (!lyrics || lyrics.trim().length === 0 || !word) {
        return res.status(400).json({ message: 'Datos no proporcionados' });
    }

    try {
        const query = encodeURIComponent(lyrics);
        const response = await fetch(
            `https://api.genius.com/search?q=${query}`,
            {
                headers: {
                    Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}`,
                },
            }
        );

        const data = await response.json();

        if (data.response.hits.length > 0) {
            const song = data.response.hits[0].result;
            const lyricsUrl = song.url;

            const fullLyrics = await getLyricsFromUrl(lyricsUrl);

            if (fullLyrics && new RegExp(`\\b${word}\\b`, 'i').test(fullLyrics)) {
                return res.status(200).json({
                    exists: true,
                    title: song.title,
                    artist: song.primary_artist.name,
                });
            }

            return res.status(200).json({
                exists: false,
                message: `La palabra "${word}" no está presente en la letra completa de la canción.`,
            });
        }

        return res.status(200).json({ exists: false });
    } catch (error) {
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}
