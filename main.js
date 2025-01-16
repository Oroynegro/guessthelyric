const palabras = ['amor', 'vida', 'corazón', 'tiempo', 'noche', 'día', 'cielo', 'mar'];
const startButton = document.getElementById('startButton');
const wordDisplay = document.getElementById('wordDisplay');
const lyricsInput = document.getElementById('lyricsInput');
const checkButton = document.getElementById('checkButton');
const loading = document.getElementById('loading');
const result = document.getElementById('result');

let currentWord = '';
let lastVerifiedLyrics = '';

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
    lastVerifiedLyrics = '';
}

function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
        .replace(/[.,!?¡¿]/g, "") // Elimina puntuación
        .trim();
}

async function checkLyrics() {
    const lyrics = lyricsInput.value.trim();
    const words = lyrics.split(/\s+/);

    if (words.length < 3) {
        showResult('Por favor ingresa al menos 3 palabras', false);
        return;
    }

    const normalizedLyrics = normalizeText(lyrics);
    const normalizedWord = normalizeText(currentWord);

    if (!normalizedLyrics.includes(normalizedWord)) {
        showResult(`La palabra "${currentWord}" no está presente en tu texto.`, false);
        return;
    }

    loading.style.display = 'block';
    checkButton.disabled = true;

    try {
        const response = await fetch('/api/check-lyrics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                lyrics,
                word: currentWord,
                // Añadimos parámetros adicionales para la verificación en el backend
                normalizedLyrics,
                normalizedWord
            }),
        });

        const data = await response.json();

        if (data.exists && data.exactMatch) {
            lastVerifiedLyrics = lyrics;
            showResult(`¡Correcto! 
                Canción: ${data.title}
                Artista: ${data.artist}`, true);
        } else if (data.exists && !data.exactMatch) {
            showResult('La letra es similar pero no exacta. Por favor, verifica que sea la letra correcta.', false);
        } else {
            showResult('No se encontró una canción con esa letra exacta.', false);
        }
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