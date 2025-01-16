export default async function handler(req, res) {
    if (req.method === "GET") {
        try {
            const GENIUS_API_TOKEN = process.env.GENIUS_API_TOKEN; // Asegúrate de configurar esta variable de entorno en Vercel
            res.status(200).json({ access_token: GENIUS_API_TOKEN });
        } catch (error) {
            res.status(500).json({ error: "Error fetching access token" });
        }
    } else {
        res.status(405).json({ error: "Method not allowed" });
    }
}
