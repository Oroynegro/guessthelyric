const palabras = ['amor', 'vida', 'corazón', 'tiempo', 'noche', 'día', 'cielo', 'mar'];
const startButton = document.getElementById('startButton');
const wordDisplay = document.getElementById('wordDisplay');
const lyricsInput = document.getElementById('lyricsInput');
const checkButton = document.getElementById('checkButton');
const loading = document.getElementById('loading');
const result = document.getElementById('result');

// Reemplaza esto con tu token de acceso de Genius
const GENIUS_ACCESS_TOKEN = 'TU_TOKEN_DE_GENIUS';
const GENIUS_API_BASE = 'https://api.genius.com';
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

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
    const searchQuery = encodeURIComponent(lyrics);
    const response = await fetch(`${GENIUS_API_BASE}/search?q=${searchQuery}`, {
        headers: {
            'Authorization': `Bearer ${GENIUS_ACCESS_TOKEN}`
        }
    });
    const data = await response.json();
    return data.response.hits;
}

async function getLyrics(url) {
    try {
        const response = await fetch(`${CORS_PROXY}${url}`);
        const html = await response.text();
        // Aquí necesitarás extraer las letras del HTML dependiendo de la estructura de la página
        // Este es un ejemplo simple, podrías necesitar ajustarlo
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const lyricsElement = doc.querySelector('.lyrics') || doc.querySelector('[class^="Lyrics__Container"]');
        return lyricsElement ? lyricsElement.textContent.trim() : '';
    } catch (error) {
        console.error('Error al obtener las letras:', error);
        return '';
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
        
        for (const hit of searchResults) {
            const songUrl = hit.result.url;
            const fullLyrics = await getLyrics(songUrl);
            const normalizedLyrics = normalizeText(fullLyrics);

            if (normalizedLyrics.includes(normalizedInput)) {
                showResult(`¡Correcto! 
                    Canción: ${hit.result.title}
                    Artista: ${hit.result.primary_artist.name}`, true);
                return;
            }
        }

        showResult('No se encontró una canción con esa letra exacta.', false);
    } catch (error) {
        console.error('Error:', error);
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