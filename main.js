const palabras = ['amor', 'vida', 'corazón', 'tiempo', 'noche', 'día', 'cielo', 'mar'];
const startButton = document.getElementById('startButton');
const wordDisplay = document.getElementById('wordDisplay');
const lyricsInput = document.getElementById('lyricsInput');
const checkButton = document.getElementById('checkButton');
const loading = document.getElementById('loading');
const result = document.getElementById('result');

// Configuración de la API
const GENIUS_ACCESS_TOKEN = 'TU_TOKEN_DE_GENIUS';
const GENIUS_API_BASE = 'https://api.genius.com';
const CORS_PROXY = 'https://api.allorigins.win/raw?url='; // Proxy CORS más confiable

let currentWord = '';

startButton.addEventListener('click', generateRandomWord);
checkButton.addEventListener('click', checkLyrics);

function generateRandomWord() {
    currentWord = palabras[Math.floor(Math.random() * palabras.length)];
    wordDisplay.textContent = `Palabra: ${currentWord}`;
    lyricsInput.style.display = 'block';
    checkButton.style.display = 'block';
    startButton.textContent = 'Nueva Palabra';
    result.style.display = 'none';
    lyricsInput.value = '';
}

function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[.,!?¡¿]/g, "")
        .trim();
}

async function searchSong(lyrics) {
    try {
        const searchQuery = encodeURIComponent(lyrics);
        const url = `${CORS_PROXY}${encodeURIComponent(`${GENIUS_API_BASE}/search?q=${searchQuery}`)}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${GENIUS_ACCESS_TOKEN}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.response.hits;
    } catch (error) {
        console.error('Error en searchSong:', error);
        throw error;
    }
}

async function getLyrics(url) {
    try {
        const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Buscar las letras en diferentes contenedores posibles
        const lyricsElement = 
            doc.querySelector('[class^="Lyrics__Container"]') ||
            doc.querySelector('.lyrics') ||
            doc.querySelector('[data-lyrics-container="true"]');

        if (!lyricsElement) {
            throw new Error('No se encontró el contenedor de letras');
        }

        return lyricsElement.textContent.trim();
    } catch (error) {
        console.error('Error en getLyrics:', error);
        throw error;
    }
}

async function checkLyrics() {
    const userInput = lyricsInput.value.trim();
    const words = userInput.split(/\s+/);

    if (words.length < 3) {
        showResult('Por favor ingresa al menos 3 palabras', false);
        return;
    }

    const normalizedInput = normalizeText(userInput);
    const normalizedWord = normalizeText(currentWord);

    if (!normalizedInput.includes(normalizedWord)) {
        showResult(`La palabra "${currentWord}" no está presente en tu texto.`, false);
        return;
    }

    loading.style.display = 'block';
    checkButton.disabled = true;

    try {
        const searchResults = await searchSong(userInput);
        
        if (!searchResults || searchResults.length === 0) {
            showResult('No se encontraron canciones con esa letra.', false);
            return;
        }

        for (const hit of searchResults) {
            try {
                const songUrl = hit.result.url;
                const fullLyrics = await getLyrics(songUrl);
                const normalizedLyrics = normalizeText(fullLyrics);

                if (normalizedLyrics.includes(normalizedInput)) {
                    showResult(`¡Correcto! 
                        Canción: ${hit.result.title}
                        Artista: ${hit.result.primary_artist.name}`, true);
                    return;
                }
            } catch (error) {
                console.error('Error al procesar resultado:', error);
                continue; // Continuar con el siguiente resultado si hay error
            }
        }

        showResult('No se encontró una canción con esa letra exacta.', false);
    } catch (error) {
        console.error('Error principal:', error);
        showResult('Error al verificar la letra. Intenta nuevamente.', false);
    } finally {
        loading.style.display = 'none';
        checkButton.disabled = false;
    }
}

function showResult(message, isSuccess) {
    result.textContent = message;
    result.style.display = 'block';
    result.className = `result ${isSuccess ? 'success' : 'error'}`;
}