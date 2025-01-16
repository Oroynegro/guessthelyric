const palabras = ['amor', 'vida', 'corazón', 'tiempo', 'noche', 'día', 'cielo', 'mar'];
const startButton = document.getElementById('startButton');
const wordDisplay = document.getElementById('wordDisplay');
const lyricsInput = document.getElementById('lyricsInput');
const checkButton = document.getElementById('checkButton');
const loading = document.getElementById('loading');
const result = document.getElementById('result');

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

async function checkLyrics() {
    const lyrics = lyricsInput.value.trim();

    if (lyrics.split(' ').length < 3) {
        showResult('Por favor ingresa al menos 3 palabras', false);
        return;
    }

    if (!lyrics.toLowerCase().includes(currentWord.toLowerCase())) {
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
            body: JSON.stringify({ lyrics, word: currentWord }),
        });

        const data = await response.json();

        if (data.exists && data.containsWord) {
            showResult(`¡Correcto! 
                Canción: ${data.title}
                Artista: ${data.artist}`, true);
        } else if (data.exists) {
            showResult(`La letra pertenece a una canción, pero no contiene la palabra "${currentWord}".`, false);
        } else {
            showResult('No se encontró una canción con esa letra exacta.', false);
        }
    } catch (error) {
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
