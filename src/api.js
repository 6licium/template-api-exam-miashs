import Fastify from 'fastify'

const fastify = Fastify()

const API_BASE_URL = 'https://api-ugi2pflmha-ew.a.run.app'

// Route GET /cities/:cityId/infos
fastify.get('/cities/:cityId/infos', async (request, reply) => {
  const { cityId } = request.params

  try {
    // Récupérer les infos de la ville via City API
    const cityResponse = await fetch(`${API_BASE_URL}/cities/${cityId}`)
    if (!cityResponse.ok) {
      return reply.status(404).send({ error: 'City not found' })
    }
    const cityData = await cityResponse.json()

    // Récupérer les prévisions météo via Weather API
    const weatherResponse = await fetch(`${API_BASE_URL}/weather/${cityId}`)
    if (!weatherResponse.ok) {
      return reply.status(404).send({ error: 'Weather data not found' })
    }
    const weatherData = await weatherResponse.json()

    // Construire la réponse finale
    const responseData = {
      coordinates: cityData.coordinates, // [lat, lon]
      population: cityData.population,
      knownFor: cityData.knownFor,
      weatherPredictions: [
        { when: 'today', min: weatherData.today.min, max: weatherData.today.max },
        { when: 'tomorrow', min: weatherData.tomorrow.min, max: weatherData.tomorrow.max }
      ],
      recipes: cityData.recipes || []
    }

    reply.send(responseData)

  } catch (error) {
    reply.status(500).send({ error: 'Internal server error', details: error.message })
  }
})

export default fastify
