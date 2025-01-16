async function getAccessToken() {
    try {
        const response = await fetch("/api/getAccessToken");
        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error("Error al obtener el token:", error);
        return null;
    }
}

async function searchLyrics(lyricFragment) {
    const token = await getAccessToken();
    if (!token) {
        document.getElementById("result").textContent = "Error: Unable to fetch access token.";
        return;
    }

    try {
        const response = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(lyricFragment)}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (data.response.hits.length > 0) {
            const song = data.response.hits[0].result;
            document.getElementById("result").innerHTML = `Correct! The song is <strong>${song.full_title}</strong>.`;
        } else {
            document.getElementById("result").textContent = "No matching lyrics found.";
        }
    } catch (error) {
        console.error("Error searching for lyrics:", error);
        document.getElementById("result").textContent = "An error occurred while searching for lyrics.";
    }
}

document.getElementById("submit-button").addEventListener("click", () => {
    const lyricInput = document.getElementById("lyric-input").value.trim();
    if (lyricInput.split(" ").length < 4) {
        document.getElementById("result").textContent = "Your input must contain at least 4 words.";
    } else {
        searchLyrics(lyricInput);
    }
});

// Set random word
const randomWords = ["strange", "love", "dream", "fire", "light"];
const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
document.getElementById("random-word").textContent = randomWord;
