const palabras = ['gone','fire', 'amor'];
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

    loading.style.display = 'block';
    checkButton.disabled = true;

    try {
        const response = await fetch('/api/check-lyrics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ lyrics }),
        });

        const data = await response.json();
        
        if (data.exists) {
            showResult(`¡Correcto! 
                Canción: ${data.title}
                Artista: ${data.artist}`, true);
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

function showResult(data, isSuccess) {
    result.style.display = 'block';
    result.className = `result ${isSuccess ? 'success' : 'error'}`;

    if (isSuccess && data.exists) {
        result.innerHTML = `
            <div class="song-info">
                <h3>¡Correcto!</h3>
                <p><strong>Canción:</strong> ${data.title}</p>
                <p><strong>Artista:</strong> ${data.artist}</p>
                ${data.thumbnailUrl ? `<img src="${data.thumbnailUrl}" alt="Portada del álbum" class="song-thumbnail">` : ''}
                <p><a href="${data.url}" target="_blank">Ver letra completa en Genius</a></p>
            </div>
        `;
    } else {
        result.textContent = '¡No se encontró una canción con esa letra exacta!';
    }
}


// Agregar los estilos al documento
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
