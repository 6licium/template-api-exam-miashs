const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3000;

const CITY_API_URL = "https://api-ugi2pflmha-ew.a.run.app/cities";
const WEATHER_API_URL = "https://api-ugi2pflmha-ew.a.run.app/weather";

app.get("/cities/:cityId/infos", async (req, res) => {
    const cityId = req.params.cityId;

    try {
        // 1️⃣ Récupérer les infos de la ville
        const cityResponse = await axios.get(`${CITY_API_URL}/${cityId}`);
        const cityData = cityResponse.data;

        // 2️⃣ Récupérer les prévisions météo
        const weatherResponse = await axios.get(`${WEATHER_API_URL}/${cityId}`);
        const weatherData = weatherResponse.data;

        // 3️⃣ Construire la réponse au bon format
        const responseData = {
            coordinates: [cityData.latitude, cityData.longitude],
            population: cityData.population,
            knownFor: cityData.knownFor,
            weatherPredictions: [
                { when: "today", min: weatherData.today.min, max: weatherData.today.max },
                { when: "tomorrow", min: weatherData.tomorrow.min, max: weatherData.tomorrow.max },
            ],
            recipes: cityData.recipes || []
        };

        res.json(responseData);

    } catch (error) {
        if (error.response && error.response.status === 404) {
            res.status(404).json({ error: "City not found" });
        } else {
            console.error(error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
