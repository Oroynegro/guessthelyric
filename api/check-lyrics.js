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
    // Buscar canciones que coincidan con la letra
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

    // Obtener la primera coincidencia
    const firstMatch = searchData.response.hits[0].result;

    // Obtener detalles de la canción
    const songResponse = await fetch(
      `https://api.genius.com/songs/${firstMatch.id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.GENIUS_ACCESS_TOKEN}`
      }
    });

    const songData = await songResponse.json();
    
    return res.json({
      exists: true,
      title: firstMatch.title,
      artist: firstMatch.primary_artist.name,
      url: firstMatch.url
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Error checking lyrics' });
  }
}