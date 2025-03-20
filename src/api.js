import Fastify from 'fastify'

const fastify = Fastify()
const API_BASE_URL = 'https://api-ugi2pflmha-ew.a.run.app'

// Fonction pour récupérer les données d'une API avec gestion d'erreur
const fetchData = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`API Error: ${response.status}`)
  return response.json()
}

// Route GET /cities/:cityId/infos
fastify.get('/cities/:cityId/infos', async (request, reply) => {
  const { cityId } = request.params

  try {
    // Récupérer les infos de la ville via City API
    const cityData = await fetchData(`${API_BASE_URL}/cities/${cityId}`)

    // Récupérer les prévisions météo via Weather API
    const weatherData = await fetchData(`${API_BASE_URL}/weather/${cityId}`)

    // Construire la réponse au format attendu
    const responseData = {
      coordinates: cityData.coordinates, // [latitude, longitude]
      population: cityData.population,
      knownFor: cityData.knownFor,
      weatherPredictions: [
        { when: 'today', min: weatherData.today.min, max: weatherData.today.max },
        { when: 'tomorrow', min: weatherData.tomorrow.min, max: weatherData.tomorrow.max }
      ],
      recipes: cityData.recipes || [] // Liste des recettes (vide si non disponible)
    }

    reply.send(responseData)

  } catch (error) {
    // Gestion des erreurs
    if (error.message.includes('API Error: 404')) {
      return reply.status(404).send({ error: 'City not found' })
    }
    reply.status(500).send({ error: 'Internal server error', details: error.message })
  }
})

export default fastify
