from django.shortcuts import render
from django.conf  import settings
import json
import datetime
import os
import requests
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from core.models import Chats
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
def delete_chat(req):
    if req.method == "DELETE":
        try:
            body = json.loads(req.body)
            chat_id = body["chat_id"]
            chat = Chats.objects.get(user=req.user, chat_id=chat_id)
            chat.delete()
            return JsonResponse({"response": "Success"})
        except:
            return JsonResponse({"response": "Failed"})
        

@login_required
def send_chat(req):
    if req.method == "POST":
        body = json.loads(req.body)
        current_chat_id = body["chat_id"]
        interaction_counter = body["counter"]
        web_url = body["search_web"]
        ollama_url = body["ollama_url"] + "/api/generate"
        user_message = body["message"]

        if body["search_web"]:
            search_result = web_search(web_url, user_message["content"])
            prompt = f"""
            You are an assistant that answers questions based on web search results.

            Question:
            {user_message["content"]}

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
            prompt = user_message["content"]

        payload = {
            "model" : body["model_name"],
            "prompt": prompt,
        }

        try:
            output = ""
            with requests.post(ollama_url, json=payload, stream=True) as response:
                response.raise_for_status()

                for line in response.iter_lines():
                    if line:
                        data = json.loads(line.decode("utf-8"))
                        output += data.get("response", "")
                        if data.get("done"):
                            break

                output.strip()

            current_chat, created = Chats.objects.get_or_create(
                id=current_chat_id,
                defaults={
                    "content": {"messages": []},
                    "user": req.user,
                    "chat_id": current_chat_id,
                    "time_stamp": datetime.datetime.now(),
                    "title": prompt
                },
            )
            if not current_chat and not created:
                return JsonResponse({"response": "Error creating new chat"})

            if "messages" not in current_chat.content or not isinstance(current_chat.content["messages"], list):
                current_chat.content["messages"] = []

            new_message = {
                "id": interaction_counter,
                "role": 'user',
                'content': prompt
            }

            new_response = {
                "id": interaction_counter + 1,
                'role': 'assistant',
                'content': output
            }
            current_chat.content['messages'].append(new_message)
            current_chat.content["messages"].append(new_response)

            current_chat.save()

            return JsonResponse({"response": output})
        except requests.exceptions.RequestException as e:
            return JsonResponse({"response": "Error getting response"})

@login_required
def get_history(req):
    if req.method == "GET":
        # TODO: Get the history of users chats. Just get the chat details
        pass

@login_required
def load_chat(req):
    if req.method == "GET":
        # TODO: Get users chat history
        pass



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


def create_chat(chat_id: int, user: str, prompt: str) -> bool:
    try:
        Chats.objects.create(
            user=user,
            content={"messages": []},
            chat_id=chat_id,
            time_stamp=datetime.datetime.now(),
            title=prompt,
        )
        return True
    except:
        return False