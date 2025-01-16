// check-lyrics.js
import fetch from 'node-fetch';
import cheerio from 'cheerio';

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

    if (!lyrics || lyrics.trim().length === 0) {
        return res.status(400).json({ message: 'Letra no proporcionada' });
    }

    try {
        // Primero buscar la canción en Genius
        const query = encodeURIComponent(lyrics);
        const searchResponse = await fetch(
            `https://api.genius.com/search?q=${query}`,
            {
                headers: {
                    Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}`,
                },
            }
        );

        const data = await searchResponse.json();
        
        if (data.response.hits.length > 0) {
            const song = data.response.hits[0].result;
            
            // Obtener la página HTML de la canción
            const lyricsPageResponse = await fetch(song.url);
            const html = await lyricsPageResponse.text();
            
            // Usar cheerio para extraer el contenedor de letras
            const $ = cheerio.load(html);
            const lyricsContainer = $('[data-lyrics-container="true"]').text();
            
            // Verificar si la frase exacta está en las letras
            const normalizedInput = lyrics.toLowerCase().trim();
            const normalizedLyrics = lyricsContainer.toLowerCase();
            
            if (normalizedLyrics.includes(normalizedInput)) {
                return res.status(200).json({
                    exists: true,
                    title: song.title,
                    artist: song.primary_artist.name,
                });
            }
        }

        return res.status(200).json({ exists: false });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}