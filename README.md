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