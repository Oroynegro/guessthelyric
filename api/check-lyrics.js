module.exports = async (req, res) => {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { lyrics } = req.body;

  try {
    const searchResponse = await fetch(
      `https://api.genius.com/search?q=${encodeURIComponent(lyrics)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.GENIUS_ACCESS_TOKEN}`
      }
    });

    const searchData = await searchResponse.json();

    if (!searchData.response.hits.length) {
      return res.json({ exists: false });
    }

    const firstMatch = searchData.response.hits[0].result;

    return res.json({
      exists: true,
      title: firstMatch.title,
      artist: firstMatch.primary_artist.name,
      url: firstMatch.url,  // URL de Genius para ver la letra completa
      thumbnailUrl: firstMatch.song_art_image_thumbnail_url // Imagen de la canción
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Error checking lyrics' });
  }
}