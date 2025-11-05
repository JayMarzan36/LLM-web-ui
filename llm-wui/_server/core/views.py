from django.shortcuts import render
from django.conf  import settings
import json
import os
import requests
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

# Load manifest when server launches
MANIFEST = {}
if not settings.DEBUG:
    f = open(f"{settings.BASE_DIR}/core/static/manifest.json")
    MANIFEST = json.load(f)

@login_required
def index(req):
    context = {
        "asset_url": os.environ.get("ASSET_URL", ""),
        "debug": settings.DEBUG,
        "manifest": MANIFEST,
        "js_file": "" if settings.DEBUG else MANIFEST["src/main.ts"]["file"],
        "css_file": "" if settings.DEBUG else MANIFEST["src/main.ts"]["css"][0]
    }
    return render(req, "core/index.html", context)

@login_required
def send_chat(req):
    if req.method == "POST":
        body = json.loads(req.body)
        web_url = body["search_web"]
        ollama_url = body["ollama_url"]
        prompt = None
        if body["search_web"]:
            search_result = web_search(web_url, body["prompt"])
            prompt = f"""
            You are an assistant that answers questions based on web search results.

            Question:
            {body["prompt"]}

            Here are the top search results (in JSON):
            {search_result}

            Instructions:
            1. Read and summarize the key information from the provided search results.
            2. Write a concise, factual answer to the question.
            3. Include direct citations using markdown links in this format:
            - [Title](URL)
            4. If the search results don't provide enough information, say so.

            Return your answer in this JSON format:
            {
            "answer": "<your written summary or explanation>",
            "sources": [
                {"title": "Example Source Title", "url": "https://example.com"},
                ...
            ]
            }
            """
        else:
            prompt = body["prompt"]

        payload = {
            "model" : body["model_name"],
            "messages": prompt,
            "temperature": 0.7
        }
        headers = {
            "Content-Type": "application/json"
        }
        try:
            response = requests.post(ollama_url, headers=headers, data=json.dumps(payload))
            response.raise_for_status()
            print(response)
            #TODO: Save data for database for chat history
            return JsonResponse({"response": response.json()})
        except requests.exceptions.RequestException as e:
            pass
    return JsonResponse({"response": "error"})


def web_search(sear_xng_url: str, query: str, top_n: int = 5):
    params = {'q' : query, 'format': "json"}
    try:
        response = requests.get(f"{sear_xng_url}/search", params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        results = data.get("results", [])[:top_n]
        simplified = [
            {
                "title": r.get("title"),
                "url": r.get("url"),
                "snippet": r.get("content"),
                "engine": r.get("engine"),
            }
            for r in results
        ]
        return json.dumps(simplified, indent=2)
    except requests.exceptions.RequestException as e:
        return None
