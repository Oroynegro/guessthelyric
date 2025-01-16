import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    const { lyrics } = req.body;
    const GENIUS_API_KEY = process.env.GENIUS_API_KEY;

    if (!lyrics || lyrics.trim().length === 0) {
        return res.status(400).json({ message: 'Letra no proporcionada' });
    }

    try {
        const query = encodeURIComponent(lyrics);
        const response = await fetch(
            `https://api.genius.com/search?q=${query}`,
            {
                headers: {
                    Authorization: `Bearer ${GENIUS_API_KEY}`,
                },
            }
        );

        const data = await response.json();

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
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}
