import fetch from 'node-fetch'

const API_BASE_URL = 'https://api.example.com' // Remplacez par votre propre API

let recipesDB = {} // Base de données fictive en mémoire pour les recettes

// Route pour récupérer les informations d'une ville
async function fetchData(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`API Error: ${response.status}`)
  return response.json()
}

export default async function (fastify, options) {
  // Récupérer les infos d'une ville
  fastify.get('/cities/:cityId', async (request, reply) => {
    const { cityId } = request.params

    try {
      const cityData = await fetchData(`${API_BASE_URL}/cities/${cityId}`)
      const weatherData = await fetchData(`${API_BASE_URL}/weather/${cityId}`)

      // S'assurer que tous les champs obligatoires sont présents et formatés correctement
      const responseData = {
        coordinates: cityData.coordinates || 'Data not available',
        population: cityData.population || 'Data not available',
        knownFor: cityData.knownFor || 'Data not available',
        weatherPredictions: [
          { 
            when: 'today', 
            min: weatherData.today?.min !== undefined ? weatherData.today.min : 'Data not available', 
            max: weatherData.today?.max !== undefined ? weatherData.today.max : 'Data not available' 
          },
          { 
            when: 'tomorrow', 
            min: weatherData.tomorrow?.min !== undefined ? weatherData.tomorrow.min : 'Data not available', 
            max: weatherData.tomorrow?.max !== undefined ? weatherData.tomorrow.max : 'Data not available' 
          }
        ],
        recipes: recipesDB[cityId] || []
      }
      
      reply.send(responseData)

    } catch (error) {
      if (error.message.includes('API Error: 404')) {
        return reply.status(404).send({ error: 'City not found' })
      }
      reply.status(500).send({ error: 'Internal server error', details: error.message })
    }
  })

  // Ajouter une recette à une ville
  fastify.post('/cities/:cityId/recipes', async (request, reply) => {
    const { cityId } = request.params
    const { content } = request.body

    // Validation du contenu
    if (!content) {
      return reply.status(400).send({ error: 'Content is required' })
    }
    
    if (typeof content !== 'string') {
      return reply.status(400).send({ error: 'Content must be a string' })
    }
    
    if (content.length < 10) {
      return reply.status(400).send({ error: 'Content is too short (min 10 chars)' })
    }
    
    if (content.length > 2000) {
      return reply.status(400).send({ error: 'Content is too long (max 2000 chars)' })
    }

    try {
      // Vérifier si la ville existe
      await fetchData(`${API_BASE_URL}/cities/${cityId}`)

      // Stocker la recette
      const newRecipe = {
        id: Date.now(), // Génération d'un ID unique basé sur le timestamp
        content: content
      }

      if (!recipesDB[cityId]) {
        recipesDB[cityId] = []
      }
      
      recipesDB[cityId].push(newRecipe)

      // Retourner la recette créée avec un statut 201 (Created)
      reply.status(201).send(newRecipe)

    } catch (error) {
      if (error.message.includes('API Error: 404')) {
        return reply.status(404).send({ error: 'City not found' })
      }
      reply.status(500).send({ error: 'Internal server error', details: error.message })
    }
  })

  // Supprimer une recette d'une ville
  fastify.delete('/cities/:cityId/recipes/:recipeId', async (request, reply) => {
    const { cityId, recipeId } = request.params
    const recipeIdInt = parseInt(recipeId, 10) // Conversion en nombre entier

    try {
      // Vérifier si la ville existe
      await fetchData(`${API_BASE_URL}/cities/${cityId}`)

      // Vérifier si la ville contient des recettes
      if (!recipesDB[cityId] || recipesDB[cityId].length === 0) {
        return reply.status(404).send({ error: 'No recipes found for this city' })
      }

      // Trouver et supprimer la recette
      const recipeIndex = recipesDB[cityId].findIndex(r => r.id === recipeIdInt)
      
      if (recipeIndex === -1) {
        return reply.status(404).send({ error: 'Recipe not found' })
      }

      // Supprimer la recette
      recipesDB[cityId].splice(recipeIndex, 1)

      // Répondre avec un statut 204 (No Content)
      reply.status(204).send()

    } catch (error) {
      if (error.message.includes('API Error: 404')) {
        return reply.status(404).send({ error: 'City not found' })
      }
      reply.status(500).send({ error: 'Internal server error', details: error.message })
    }
  })
}