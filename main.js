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
const gameConfig = document.getElementById('gameConfig'); 
const languageSelectContainer = document.getElementById('languageSelectContainer');
const gameArea = document.getElementById('gameArea');
const minWordsContainer = document.getElementById('minWordsContainer');
const minWords = document.getElementById('minWords');


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

if (wordChoiceSelect.value === 'random'){
    startButton.addEventListener('click', generateRandomWord);
} else{
    startButton.addEventListener('click', setManualWord);
}

checkButton.addEventListener('click', checkLyrics);

function generateRandomWord() {
    
    const selectedLanguage = languageSelect.value;  // Obtener el idioma seleccionado
    
    if (palabras[selectedLanguage].length === 0) {
        wordDisplay.textContent = 'Cargando palabras...';
        return;
    }

    // Seleccionar una palabra aleatoria del array correspondiente
    currentWord = palabras[selectedLanguage][Math.floor(Math.random() * palabras[selectedLanguage].length)];
    wordDisplay.textContent = `${currentWord.toUpperCase()}`;
    lyricsInput.placeholder = `Escribe la letra de la canción (mínimo ${minWords.value} palabras)`
    lyricsInput.style.display = 'block';
    checkButton.style.display = 'block';
    startButton.style.display = 'none';
    result.style.display = 'none';
    lyricsInput.value = '';
    gameConfig.style.display = 'none'
    gameArea.style.display = 'flex'
}

function setManualWord() {
    const manualWord = manualWordInputField.value.trim();
    if (manualWord) {
        currentWord = manualWord;
        wordDisplay.textContent = `${currentWord.toUpperCase()}`;
        lyricsInput.placeholder = `Escribe la letra de la canción (mínimo ${minWords.value} palabras)`;
        lyricsInput.style.display = 'block';
        checkButton.style.display = 'block';
        gameConfig.style.display = 'none';
        gameArea.style.display = 'flex'
        
        
    } else {
        alert('Por favor ingresa una palabra.');
    }
}

// Asegúrate de agregar el evento `change` al `wordChoiceSelect` para actualizar el manejador de eventos.
wordChoiceSelect.addEventListener('change', handleWordChoice);

// Manejador que cambia el comportamiento del botón de inicio dependiendo de la opción seleccionada
function handleWordChoice() {
    const choice = wordChoiceSelect.value;

    if (choice === 'manual') {
        manualWordInput.style.display = 'flex'; // Mostrar el input de palabra manual
        lyricsInput.style.display = 'none'; // Ocultar el input de letras
        checkButton.style.display = 'none'; // Ocultar el botón de comprobar letra
        wordDisplay.textContent = 'Escribe una palabra';
        languageSelectContainer.style.display = 'none';

        // Cambiar el manejador del botón a la función de escribir palabra
        startButton.removeEventListener('click', generateRandomWord);
        startButton.addEventListener('click', setManualWord);
    } else {
        manualWordInput.style.display = 'none'; // Ocultar el input de palabra manual
        languageSelectContainer.style.display = 'flex';

        // Cambiar el manejador del botón a la función de generar palabra aleatoria
        startButton.removeEventListener('click', setManualWord);
        startButton.addEventListener('click', generateRandomWord);
    }
}

// Inicia el juego en función del modo seleccionado
if (wordChoiceSelect.value === 'random') {
    startButton.addEventListener('click', generateRandomWord);
} else {
    startButton.addEventListener('click', setManualWord);
}


async function checkLyrics() {
    const normalizeText = (text) =>
        text.toLowerCase()
            .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '') // Elimina puntuación
            .replace(/\s{2,}/g, ' ') // Reemplaza múltiples espacios
            .trim();

    const lyrics = normalizeText(lyricsInput.value.trim());
    
    if (lyrics.split(' ').length <= minWords.value-1) {
        showResult(`Ingresa al menos ${minWords.value} palabras consecutivas`, false);
        return;
    }

    // Validación de la palabra en la letra
    const wordRegex = new RegExp(`\\b${currentWord}\\b`, 'i');
    if (!wordRegex.test(lyrics)) {
        showResult(`La palabra "${currentWord}" no está presente en tu texto`, false);
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
                `<p id="posible">Se encontró una posible coincidencia, pero no se pudo verificar la letra exacta.</p>`,
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
            <span class="titleSong">${data.title}</span>
            <span class="artistSong">${data.artist}</span>
            <p>${message}</p>
        `;
    } else {
        result.innerHTML = `<p>${message}</p>`;
    }

    result.style.display = 'flex';
}
