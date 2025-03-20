import fetch from 'node-fetch';

const API_BASE_URL = 'https://api-ugi2pflmha-ew.a.run.app';

// Stockage des recettes en mémoire
const recipesDB = {}; // { cityId: [{ id, content }] }

// Fonction pour récupérer les données d'une API avec gestion d'erreur
const fetchData = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
};

// Route GET /cities/:cityId/infos
const getCityInfo = async (request, reply) => {
  const { cityId } = request.params;

  try {
    // Récupérer les infos de la ville via City API
    const cityData = await fetchData(`${API_BASE_URL}/cities/${cityId}`);

    // Récupérer les prévisions météo via Weather API
    const weatherData = await fetchData(`${API_BASE_URL}/weather/${cityId}`);

    // Construire la réponse au format attendu
    const responseData = {
      coordinates: cityData.coordinates,
      population: cityData.population,
      knownFor: cityData.knownFor,
      weatherPredictions: [
        { when: 'today', min: weatherData.today.min, max: weatherData.today.max },
        { when: 'tomorrow', min: weatherData.tomorrow.min, max: weatherData.tomorrow.max }
      ],
      recipes: recipesDB[cityId] || []
    };

    reply.send(responseData);

  } catch (error) {
    if (error.message.includes('API Error: 404')) {
      return reply.status(404).send({ error: 'City not found' });
    }
    reply.status(500).send({ error: 'Internal server error', details: error.message });
  }
};

// Route POST /cities/:cityId/recipes
const createRecipe = async (request, reply) => {
  const { cityId } = request.params;
  const { content } = request.body;

  // Vérifications des erreurs
  if (!content) return reply.status(400).send({ error: 'Content is required' });
  if (content.length < 10) return reply.status(400).send({ error: 'Content is too short (min 10 chars)' });
  if (content.length > 2000) return reply.status(400).send({ error: 'Content is too long (max 2000 chars)' });

  try {
    // Vérifier si la ville existe
    await fetchData(`${API_BASE_URL}/cities/${cityId}`);

    // Stocker la recette
    const newRecipe = {
      id: Date.now(), // Génération d'un ID unique
      content
    };

    if (!recipesDB[cityId]) recipesDB[cityId] = [];
    recipesDB[cityId].push(newRecipe);

    reply.status(201).send(newRecipe);

  } catch (error) {
    if (error.message.includes('API Error: 404')) {
      return reply.status(404).send({ error: 'City not found' });
    }
    reply.status(500).send({ error: 'Internal server error', details: error.message });
  }
};

// Route DELETE /cities/:cityId/recipes/:recipeId
const deleteRecipe = async (request, reply) => {
  const { cityId, recipeId } = request.params;

  try {
    // Vérifier si la ville existe
    await fetchData(`${API_BASE_URL}/cities/${cityId}`);

    // Vérifier si la ville contient des recettes
    if (!recipesDB[cityId] || recipesDB[cityId].length === 0) {
      return reply.status(404).send({ error: 'No recipes found for this city' });
    }

    // Trouver et supprimer la recette
    const recipeIndex = recipesDB[cityId].findIndex(r => r.id === parseInt(recipeId));
    if (recipeIndex === -1) {
      return reply.status(404).send({ error: 'Recipe not found' });
    }

    recipesDB[cityId].splice(recipeIndex, 1);

    reply.status(204).send(); // No Content

  } catch (error) {
    if (error.message.includes('API Error: 404')) {
      return reply.status(404).send({ error: 'City not found' });
    }
    reply.status(500).send({ error: 'Internal server error', details: error.message });
  }
};

// Export des routes
export default async function api(fastify, options) {
  fastify.get('/cities/:cityId/infos', getCityInfo);
  fastify.post('/cities/:cityId/recipes', createRecipe);
  fastify.delete('/cities/:cityId/recipes/:recipeId', deleteRecipe);
}
