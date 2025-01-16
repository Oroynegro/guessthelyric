// check-lyrics.js
import fetch from 'node-fetch';

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

    const { lyrics } = req.body;
    const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;

    try {
        // 1. Primero buscar en Genius para obtener el artista y título
        const searchResponse = await fetch(
            `https://api.genius.com/search?q=${encodeURIComponent(lyrics)}`,
            {
                headers: {
                    Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}`,
                },
            }
        );

        const data = await searchResponse.json();
        
        if (data.response.hits.length === 0) {
            return res.status(200).json({ exists: false });
        }

        const song = data.response.hits[0].result;
        
        // 2. Usar lyrics.ovh para obtener la letra completa
        const lyricsResponse = await fetch(
            `https://api.lyrics.ovh/v1/${encodeURIComponent(song.primary_artist.name)}/${encodeURIComponent(song.title)}`
        );

        if (!lyricsResponse.ok) {
            return res.status(200).json({
                exists: true,
                verified: false,
                title: song.title,
                artist: song.primary_artist.name,
            });
        }

        const lyricsData = await lyricsResponse.json();
        
        if (lyricsData.lyrics) {
            const normalizeText = (text) =>
                text.toLowerCase()
                    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '') // Elimina puntuación
                    .replace(/\s{2,}/g, ' ') // Reemplaza múltiples espacios por uno solo
                    .trim();
        
            const fullLyrics = lyricsData.lyrics.split('\n'); // Divide las letras en líneas originales
            const normalizedLyrics = normalizeText(lyricsData.lyrics); // Letra completa normalizada
            const normalizedUserLyrics = normalizeText(lyrics); // Texto del usuario normalizado
        
            // Busca la palabra en las líneas normalizadas
            const matchingIndex = fullLyrics.findIndex(line => 
                normalizeText(line).includes(normalizedUserLyrics)
            );
        
            if (matchingIndex !== -1) {
                const start = Math.max(0, matchingIndex - 4); // Incluye hasta 4 líneas antes
                const end = Math.min(fullLyrics.length, matchingIndex + 4); // Incluye hasta 4 líneas después
        
                const stanza = fullLyrics.slice(start, end).join('\n').trim();
        
                return res.status(200).json({
                    exists: true,
                    verified: true,
                    title: song.title,
                    artist: song.primary_artist.name,
                    stanza,
                });
            }
        }
        
        

        // Si la letra exacta no se encontró
        return res.status(200).json({
            exists: false,
            message: 'La letra proporcionada no coincide con la canción exacta'
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Error al verificar la letra' });
    }
}