const palabras = ['dormir', "luna", "gustas"];
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

    // Validación de la palabra en la letra
    const wordRegex = new RegExp(`\\b${currentWord}\\b`, 'i');
    if (!wordRegex.test(lyrics)) {
        showResult(`La palabra "${currentWord}" no está presente correctamente en tu texto.`, false);
        return;
    }

    loading.style.display = 'block';
    checkButton.disabled = true;

    try {
        const response = await fetch('https://guessthelyric.vercel.app/api/check-lyrics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ lyrics }),
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (data.exists && data.verified) {
            showResult('¡Correcto! Letra verificada.', true, data);
        } else if (data.exists && !data.verified) {
            showResult(
                `Se encontró una posible coincidencia, pero no se pudo verificar la letra exacta.`,
                false,
                data
            );
        } else {
            showResult('No se encontró una canción con esa letra exacta.', false);
        }
        
        
    } catch (error) {
        console.error('Error:', error);
        showResult('Error al verificar la letra. Por favor, intenta nuevamente en unos momentos.', false);
    } finally {
        loading.style.display = 'none';
        checkButton.disabled = false;
    }
}

function showResult(message, isSuccess, data) {
    result.innerHTML = ''; // Limpiar contenido previo

    if (isSuccess) {
        // Reemplazar más de 2 <br> consecutivos por solo 2
        const formattedStanza = data.stanza
            .replace(/\n/g, '<br>') // Convertir saltos de línea a <br>
            .replace(/(<br>\s*){3,}/g, '<br><br>'); // Limitar a máximo 2 <br>

        result.innerHTML = `
            <h3 class="lyricVerification">¡Correcto! Letra verificada</h3>
            <span class="titleSong">${data.title}</span>
            <span class="artistSong">${data.artist}</span>
            <div class="stanzaSong">${formattedStanza}</div>
        `;
    } else if (data && data.exists) {
        result.innerHTML = `
            <h3 class="lyricVerification">Posible coincidencia encontrada</h3>
            <span class="titleSong">${data.title}</span>
            <span class="artistSong">${data.artist}</span>
            <p>${message}</p>
        `;
    } else {
        result.innerHTML = `<p>${message}</p>`;
    }

    result.style.display = 'block';
}




