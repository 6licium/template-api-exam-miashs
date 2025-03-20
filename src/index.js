import 'dotenv/config'
import Fastify from 'fastify'
import { submitForReview } from './submission.js'
import { deleteCityRecipe, getCityInfo, postCityRecipe } from './func.js'
import FastifySwagger from "@fastify/swagger";
import FastifySwaggerUi from "@fastify/swagger-ui";

const fastify = Fastify({
  logger: true,
})

await fastify.register(FastifySwagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "Test swagger",
        description: "Testing the Fastify swagger API",
        version: "0.1.0",
      },

      components: {
        securitySchemes: {
          apiKey: {
            type: "apiKey",
            name: "apiKey",
            in: "header",
          },
        },
      },
      externalDocs: {
        url: "https://swagger.io",
        description: "Find more info here",
      },
    },
  });
  
  await fastify.register(FastifySwaggerUi, {
    routePrefix: "/",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
  });

fastify.listen(
  {
    port: process.env.PORT || 3000,
    host: process.env.RENDER_EXTERNAL_URL ? '0.0.0.0' : process.env.HOST || 'localhost',
  },
  function (err) {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }

    //////////////////////////////////////////////////////////////////////
    // Don't delete this line, it is used to submit your API for review //
    // everytime your start your server.                                //
    //////////////////////////////////////////////////////////////////////
    submitForReview(fastify)
  }
)

const schema = {
    type: 'object',
    required: ['content'],
    additionalProperties: false,
    properties: {
        content: { type: 'string' }
    }
}

fastify.get("/cities/:cityId/infos", getCityInfo)

fastify.post("/cities/:cityId/recipes", {
    schema: {
      body: schema
    }
  }, postCityRecipe)

fastify.delete("/cities/:cityId/recipes/:recipeId", deleteCityRecipe)