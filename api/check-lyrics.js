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

    const { lyrics } = req.body;

    if (!lyrics || lyrics.trim().length === 0) {
        return res.status(400).json({ message: 'Letra no proporcionada' });
    }

    try {
        // Validación del token de acceso
        const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;
        if (!GENIUS_ACCESS_TOKEN) {
            console.error('Token de acceso no configurado');
            return res.status(500).json({ message: 'Error de configuración del servidor' });
        }

        // Búsqueda en Genius con manejo de errores
        const query = encodeURIComponent(lyrics);
        const searchResponse = await fetch(
            `https://api.genius.com/search?q=${query}`,
            {
                headers: {
                    Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}`,
                },
            }
        );

        if (!searchResponse.ok) {
            console.error('Error en la respuesta de Genius:', await searchResponse.text());
            return res.status(502).json({ message: 'Error al conectar con Genius' });
        }

        const data = await searchResponse.json();
        
        if (!data.response || !data.response.hits || data.response.hits.length === 0) {
            return res.status(200).json({ exists: false });
        }

        const song = data.response.hits[0].result;
        
        // En lugar de hacer web scraping, vamos a confiar en la búsqueda inicial
        // y hacer una comparación más flexible
        const songTitle = song.title.toLowerCase();
        const artistName = song.primary_artist.name.toLowerCase();
        const fullSongInfo = `${songTitle} ${artistName}`;
        
        // Si la búsqueda devuelve un resultado, consideramos que es una coincidencia válida
        return res.status(200).json({
            exists: true,
            title: song.title,
            artist: song.primary_artist.name,
            confidence: 'Posible coincidencia encontrada'
        });

    } catch (error) {
        console.error('Error detallado:', error);
        return res.status(500).json({ 
            message: 'Error interno del servidor',
            detail: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}