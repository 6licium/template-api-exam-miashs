import fetch from 'node-fetch'

const API_BASE_URL = 'https://api-ugi2pflmha-ew.a.run.app'
const recipesStore = {} // Stocke les recettes associées aux villes

export default async function api(fastify, options) {
  // GET /cities/:cityId/infos
  fastify.get('/cities/:cityId/infos', async (request, reply) => {
    const { cityId } = request.params

    try {
      // Récupérer les infos de la ville
      const cityResponse = await fetch(`${API_BASE_URL}/cities/${cityId}`)
      if (!cityResponse.ok) {
        return reply.code(404).send({ error: 'Ville non trouvée' })
      }
      const cityData = await cityResponse.json()

      // Récupérer la météo
      const weatherResponse = await fetch(`${API_BASE_URL}/weather/${cityId}`)
      if (!weatherResponse.ok) {
        return reply.code(500).send({ error: 'Impossible de récupérer la météo' })
      }
      const weatherData = await weatherResponse.json()

      // Construire la réponse
      const response = {
        coordinates: [cityData.latitude, cityData.longitude],
        population: cityData.population,
        knownFor: cityData.knownFor,
        weatherPredictions: [
          { when: 'today', min: weatherData.today.min, max: weatherData.today.max },
          { when: 'tomorrow', min: weatherData.tomorrow.min, max: weatherData.tomorrow.max },
        ],
        recipes: recipesStore[cityId] || [], // Renvoie les recettes stockées pour cette ville
      }

      return reply.send(response)
    } catch (error) {
      return reply.code(500).send({ error: 'Erreur interne du serveur' })
    }
  })

  // POST /cities/:cityId/recipes
  fastify.post('/cities/:cityId/recipes', async (request, reply) => {
    const { cityId } = request.params
    const { content } = request.body

    // Vérifications des erreurs
    if (!content || content.length < 10 || content.length > 2000) {
      return reply.code(400).send({ error: 'Le contenu doit avoir entre 10 et 2000 caractères' })
    }

    // Vérifier si la ville existe
    try {
      const cityResponse = await fetch(`${API_BASE_URL}/cities/${cityId}`)
      if (!cityResponse.ok) {
        return reply.code(404).send({ error: 'Ville non trouvée' })
      }
    } catch (error) {
      return reply.code(500).send({ error: 'Erreur lors de la vérification de la ville' })
    }

    // Ajouter la recette
    if (!recipesStore[cityId]) recipesStore[cityId] = []
    const newRecipe = { id: Date.now(), content }
    recipesStore[cityId].push(newRecipe)

    return reply.code(201).send(newRecipe)
  })

  // DELETE /cities/:cityId/recipes/:recipeId
  fastify.delete('/cities/:cityId/recipes/:recipeId', async (request, reply) => {
    const { cityId, recipeId } = request.params

    // Vérifier si la ville existe
    if (!recipesStore[cityId]) {
      return reply.code(404).send({ error: 'Ville non trouvée ou sans recettes' })
    }

    // Trouver la recette
    const index = recipesStore[cityId].findIndex(recipe => recipe.id === parseInt(recipeId))
    if (index === -1) {
      return reply.code(404).send({ error: 'Recette non trouvée' })
    }

    // Supprimer la recette
    recipesStore[cityId].splice(index, 1)

    return reply.code(204).send() // No Content
  })
}
