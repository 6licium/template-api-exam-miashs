let nbRecipes = 0
let recipes = {}

export async function getCityInfo(req, rep) {
    try {
        let cityId = req.params["cityId"]

        const responseInsight = await fetch(`https://api-ugi2pflmha-ew.a.run.app/cities/${cityId}/insights?apiKey=${process.env.API_KEY}`);

        if (!responseInsight.ok) {
            throw new Error(`La ville n'existe pas`);
        }
        
        const insights = await responseInsight.json();

        const responseMeteo = await fetch(`https://api-ugi2pflmha-ew.a.run.app/weather-predictions?apiKey=${process.env.API_KEY}&cityId=${cityId}`);

        if (!responseMeteo.ok) {
            throw new Error(`Pas de météo ?`);
        }
        
        const meteo = await responseMeteo.json();

        rep.send({
            coordinates:[insights.coordinates.latitude, insights.coordinates.longitude],
            population:insights.population,
            knownFor:insights.knownFor,
            weatherPredictions:meteo[0].predictions,
            recipes:recipes[cityId] ? recipes[cityId] : []
        })

    } catch (error) {
        console.error(error);
        rep.status(500).send({ error: error.message });
    }

}




export async function postCityRecipe(req, rep) {
    let cityId = req.params["cityId"]
    
    try {
        if (!req.body) {
            throw new Error("No body");
        }

        let { content } = req.body

        if (!content) {
            throw new Error("No content");
        }

        const responseCity = await fetch(`https://api-ugi2pflmha-ew.a.run.app/cities?apiKey=${process.env.API_KEY}&search=${cityId}`);

        if (responseCity.status == 404) {
            rep.status(404).send({error:"La ville n'existe pas"});
            return
        } 

        if (!Object.keys(recipes).includes(cityId)) {
            recipes[cityId] = []
        }

        if (content.length < 10 || content.length > 2000) {
            rep.status(400).send({ error:"Content too short or too long"});
            return
        }

        recipes[cityId].push({id: ++nbRecipes, content:content})
        rep.status(201).send({id: nbRecipes, content:content})

    } catch (error) {
        console.error(error);
        rep.status(400).send({ error: error.message });
    }
    
}


export async function deleteCityRecipe(req, rep) {
    try {
        let cityId = req.params["cityId"]
        let recipeId = req.params["recipeId"]

        const responseCity = await fetch(`https://api-ugi2pflmha-ew.a.run.app/cities?apiKey=${process.env.API_KEY}&search=${cityId}`);

        if (responseCity.status == 404) {
            rep.status(404).send({error:"La ville n'existe pas"});
            return
        }

        if (Object.keys(recipes).includes(cityId)) {
            let len = recipes[cityId].length
            recipes[cityId] = recipes[cityId].filter((v) => {return v.id != recipeId})

            if (len == recipes[cityId].length) {
                rep.status(404).send({error:"La recette n'existe pas"});
                return
            }
        } else {
            rep.status(404).send({error:"La recette n'existe pas"});
            return
        }

        rep.status(204).send({})
    } catch (error) {
        console.error(error);
        rep.status(500).send({ error: error.message });
    }

}