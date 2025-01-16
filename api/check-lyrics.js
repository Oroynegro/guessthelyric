import fetch from 'node-fetch';

export default async function handler(req, res) {
    try {
        // Verificar método
        if (req.method !== 'POST') {
            return res.status(405).json({ message: 'Método no permitido' });
        }

        // Verificar cuerpo de la solicitud
        const { lyrics } = req.body;
        if (!lyrics || lyrics.trim().length === 0) {
            return res.status(400).json({ message: 'Letra no proporcionada' });
        }

        // Verificar clave API
        const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;
        if (!GENIUS_ACCESS_TOKEN) {
            console.error('Error: Clave API no configurada.');
            return res.status(500).json({ message: 'Clave API no configurada' });
        }

        // Realizar consulta a la API de Genius
        const query = encodeURIComponent(lyrics);
        const response = await fetch(
            `https://api.genius.com/search?q=${query}`,
            {
                headers: {
                    Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}`,
                },
            }
        );

        // Verificar respuesta de la API
        if (!response.ok) {
            console.error('Error en la respuesta de la API de Genius:', response.statusText);
            return res.status(500).json({ message: 'Error en la API de Genius' });
        }

        const data = await response.json();

        // Manejar resultados
        if (data.response.hits.length > 0) {
            const song = data.response.hits[0].result;
            return res.status(200).json({
                exists: true,
                title: song.title,
                artist: song.primary_artist.name,
            });
        }

        return res.status(200).json({ exists: false });
    } catch (error) {
        // Registrar errores
        console.error('Error interno del servidor:', error);
        return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
}
