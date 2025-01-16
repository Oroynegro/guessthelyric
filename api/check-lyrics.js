const { getLyrics, getSong } = require('genius-lyrics-api');

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

  const options = {
    apiKey: process.env.GENIUS_ACCESS_TOKEN,
    title: lyrics,
    optimizeQuery: true
  };

  try {
    const results = await getSong(options);
    
    if (!results) {
      return res.json({ exists: false });
    }

    // Obtener la letra completa de la canción
    const fullLyrics = await getLyrics(results.url);
    
    // Verificar si la letra proporcionada está en la canción
    const lyricsExist = fullLyrics.toLowerCase().includes(lyrics.toLowerCase());

    return res.json({
      exists: lyricsExist,
      title: results.title,
      artist: results.artist,
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Error checking lyrics' });
  }
}