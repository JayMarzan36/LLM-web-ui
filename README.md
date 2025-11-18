# LLM-web-ui
I want to make my own version of OpenWebUI were I will host Ollama in a docker container and then interact with LLM models through this web ui.

# Description
A single page chat interface for a locally hosted LLM model. Were users can chat with a LLM model send images and documents as well as searching the web via SearXNG.

This ui, Ollama, and SearXNG will be hosted in their own containers in docker.

There is a database to keep track of chats between users and models and some user settings.

Using Node for front end and python for the backend and making API calls to Ollama and SearXNG.

# Requirements
* Ollama
* embeddinggemma:300m (embedding model)
## Optional
* SearXNG



# Instructions
You will have to add a .env file into `_server/.env` and set the contents to only be `ASSET_URL=""`.

Aswell as building the frontend and then build the docker image.

You can build the frontend by going into the `client` folder and running `npm run build`.

And then in the root of the app running `docker compose build`.