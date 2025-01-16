// check-lyrics.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
    // ... (código anterior igual hasta la verificación de letras)

    try {
        // ... (código de búsqueda en Genius igual)

        const lyricsResponse = await fetch(
            `https://api.lyrics.ovh/v1/${encodeURIComponent(song.primary_artist.name)}/${encodeURIComponent(song.title)}`
        );

        if (!lyricsResponse.ok) {
            return res.status(200).json({
                exists: true,
                verified: false,
                title: song.title,
                artist: song.primary_artist.name,
                source: 'Genius (sin verificación exacta)'
            });
        }

        const lyricsData = await lyricsResponse.json();
        
        if (lyricsData.lyrics) {
            const fullLyrics = lyricsData.lyrics.toLowerCase();
            const userLyrics = lyrics.toLowerCase().trim();
            
            const index = fullLyrics.indexOf(userLyrics);
            if (index !== -1) {
                // Encontrar el inicio del verso (buscar el salto de línea anterior)
                let contextStart = fullLyrics.lastIndexOf('\n', index);
                contextStart = contextStart === -1 ? index : contextStart + 1;
                
                // Encontrar el final del verso (buscar el próximo salto de línea)
                let contextEnd = fullLyrics.indexOf('\n', index + userLyrics.length);
                contextEnd = contextEnd === -1 ? index + userLyrics.length : contextEnd;
                
                return res.status(200).json({
                    exists: true,
                    verified: true,
                    title: song.title,
                    artist: song.primary_artist.name,
                    source: 'Verificado con lyrics.ovh',
                    matchStart: contextStart,
                    matchEnd: contextEnd,
                    matchLength: userLyrics.length
                });
            }
        }

        // ... (resto del código igual)
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Error al verificar la letra' });
    }
}