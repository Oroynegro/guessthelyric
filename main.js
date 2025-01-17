const startButton = document.getElementById('startButton');
const wordDisplay = document.getElementById('wordDisplay');
const lyricsInput = document.getElementById('lyricsInput');
const checkButton = document.getElementById('checkButton');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const languageSelect = document.getElementById('languageSelect'); // Elemento de selección de idioma
const wordChoiceSelect = document.getElementById('wordChoiceSelect'); // Elemento de selección de opción de palabra
const manualWordInput = document.getElementById('manualWordInput'); // Campo de entrada de palabra manual
const manualWordInputField = document.getElementById('manualWord'); // Campo de texto para palabra manual
const setWordButton = document.getElementById('setWordButton'); // Botón para establecer palabra manual

let currentWord = '';
let palabras = { espanol: [], ingles: [] };  // Inicializamos un objeto para las palabras en ambos idiomas

// Cargar las palabras desde el archivo JSON
async function loadWords() {
    try {
        const response = await fetch('words.json'); // Ruta al archivo JSON
        const data = await response.json();         // Convertir el archivo JSON en un objeto JavaScript
        palabras = data;                            // Asignar las palabras a la variable
    } catch (error) {
        console.error('Error al cargar las palabras:', error);
    }
}

// Llamar a loadWords cuando la página se haya cargado
window.onload = loadWords;

startButton.addEventListener('click', generateRandomWord);
checkButton.addEventListener('click', checkLyrics);
setWordButton.addEventListener('click', setManualWord); // Establecer palabra manual

function generateRandomWord() {
    const selectedLanguage = languageSelect.value;  // Obtener el idioma seleccionado
    
    if (palabras[selectedLanguage].length === 0) {
        wordDisplay.textContent = 'Cargando palabras...';
        return;
    }

    // Seleccionar una palabra aleatoria del array correspondiente
    currentWord = palabras[selectedLanguage][Math.floor(Math.random() * palabras[selectedLanguage].length)];
    wordDisplay.textContent = `Palabra: ${currentWord}`;
    lyricsInput.style.display = 'block';
    checkButton.style.display = 'block';
    startButton.textContent = 'Nueva Palabra';
    result.style.display = 'none';
    lyricsInput.value = '';
}

function setManualWord() {
    const manualWord = manualWordInputField.value.trim();
    if (manualWord) {
        currentWord = manualWord;
        wordDisplay.textContent = `Palabra: ${currentWord}`;
        lyricsInput.style.display = 'block';
        checkButton.style.display = 'block';
        startButton.textContent = 'Nueva Palabra';
        result.style.display = 'none';
        manualWordInputField.value = ''; // Limpiar el input
        manualWordInput.style.display = 'none'; // Ocultar el input después de establecer la palabra
    } else {
        alert('Por favor ingresa una palabra.');
    }
}

wordChoiceSelect.addEventListener('change', handleWordChoice);

function handleWordChoice() {
    const choice = wordChoiceSelect.value;
    if (choice === 'manual') {
        manualWordInput.style.display = 'block'; // Mostrar el input de palabra manual
        lyricsInput.style.display = 'none'; // Ocultar el input de letras
        checkButton.style.display = 'none'; // Ocultar el botón de comprobar letra
        wordDisplay.textContent = 'Escribe una palabra';
    } else {
        manualWordInput.style.display = 'none'; // Ocultar el input de palabra manual
    }
}

async function checkLyrics() {
    const normalizeText = (text) =>
        text.toLowerCase()
            .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '') // Elimina puntuación
            .replace(/\s{2,}/g, ' ') // Reemplaza múltiples espacios
            .trim();

    const lyrics = normalizeText(lyricsInput.value.trim());
    
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
        // Limitar las palabras a un máximo de 40 si la letra está toda seguida
        let formattedStanza = data.stanza
            .replace(/\n/g, '<br>') // Convertir saltos de línea a <br>
            .replace(/(<br>\s*){3,}/g, '<br><br>'); // Limitar a máximo 2 <br>

        // Si no hay saltos de línea o <br>, limitar a 40 palabras
        if (!formattedStanza.includes('<br>')) {
            const words = formattedStanza.split(/\s+/); // Dividir en palabras
            if (words.length > 40) {
                formattedStanza = words.slice(0, 40).join(' ') + '...'; // Limitar a 40 palabras y añadir "..."
            }
        }

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

    result.style.display = 'flex';
}
