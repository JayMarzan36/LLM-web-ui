from django.shortcuts import render
from django.conf import settings
import json
import datetime
import os
import requests
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from core.models import Chats, Settings

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
        "css_file": "" if settings.DEBUG else MANIFEST["src/main.ts"]["css"][0],
    }
    return render(req, "core/index.html", context)


@login_required
def delete_chat(req):
    """"
    Delete a chat from the database

    Args:
        req (http_request): The user request

    Returns:
        JsonResponse: Json response of either "Success" or "Failed"
    """
    if req.method == "DELETE":
        try:
            body = json.loads(req.body)
            chat_id = body["chat_id"]
            chat = Chats.objects.get(user=req.user, chat_id=chat_id)
            chat.delete()
            return JsonResponse({"response": "Success"})
        except:
            return JsonResponse({"response": "Failed"})


def generate_llm_prompt(req, current_chat_id: int, body: dict, web_url: str):
    """
    Generates the prompt for the LLM, incorporating previous chat messages
    and the current user message.
    
    Args:
        req (backend request): The user request
        current_chat_id (int): The current chat id
        body (dict): The user's request content
        web_url (str): The url to make a web search to
    
    Returns:
        If search_result = None, JsonResponse: {"response", "Error getting response"}
        json: {"mode": body["model_name"], "prompt", prompt}
    """
    
    previous_chats = None
    try:
        chat = Chats.objects.get(chat_id=current_chat_id, user=req.user)
        previous_chats = chat.content["messages"]
    except Chats.DoesNotExist:
        previous_chats = []

    prompt = (
        f"Previous interactions {previous_chats}\n\nUser: {body['message']["content"]}"
    )

    if body["search_web"]:
        search_result = web_search(web_url, body["message"]["content"])

        if search_result == None:
            return JsonResponse({"response": "Error getting response"})

        prompt += f"""
        Here are the top search results (in JSON):
        {search_result}

        When answering, use the information from these search results.
        Always include your sources explicitly in the response — 
        for example, cite the URLs or titles from the JSON results that support your answer.
        If a statement is based on your own reasoning or general knowledge, note that clearly.
        """

    return {"model": body["model_name"], "prompt": prompt}


@login_required
def send_chat(req):
    """
    Handles the sending of a chat message, including LLM interaction and
    message storage.
    
    Args:
        req (backend request): user request
    
    Returns:
        JsonResponse: A response message of either {"response": either of the following "Error creating new chat", "Error getting response", or output}
    """
    if req.method == "POST":
        body = json.loads(req.body)
        current_chat_id = body["chat_id"]
        interaction_counter = body["counter"]
        web_url = body["search_web_url"]
        ollama_url = body["ollama_url"] + "/api/generate"
        user_message = body["message"]

        payload = generate_llm_prompt(req, current_chat_id, body, web_url)

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
                    "title": (user_message["content"]),
                },
            )
            if not current_chat and not created:
                return JsonResponse({"response": "Error creating new chat"})

            if "messages" not in current_chat.content or not isinstance(
                current_chat.content["messages"], list
            ):
                current_chat.content["messages"] = []

            new_message = {
                "id": interaction_counter,
                "role": "user",
                "content": (user_message["content"]),
            }

            new_response = {
                "id": interaction_counter + 1,
                "role": "assistant",
                "content": output,
            }

            current_chat.content["messages"].append(new_message)

            current_chat.content["messages"].append(new_response)

            current_chat.save()

            return JsonResponse({"response": output})
        except requests.exceptions.RequestException as e:
            print(e)
            return JsonResponse({"response": "Error getting response"})


@login_required
def get_chats(req):
    """
    Get users chat history

    Args:
        req (backend request: user request

    Returns:
        JsonResponse: {"response": either user_return or "Error"}
    """
    if req.method == "GET":
        try:
            user_chats = Chats.objects.filter(user=req.user)
            user_return = {"user_chats": []}
            for chat in user_chats:
                temp = {}
                temp["chat_id"] = chat.chat_id
                temp["time_stamp"] = chat.time_stamp
                temp["title"] = chat.title
                user_return["user_chats"].append(temp)
            return JsonResponse({"response": user_return})
        except:
            return JsonResponse({"response": {"Error"}})


@login_required
def load_chat(req):
    """
    Load a specific chat

    Args:
        req (backend request): user request

    Returns:
        JsonResponse: {"response": either user_return or "Error"}
    """
    if req.method == "POST":
        try:
            body = json.loads(req.body)
            chat_id = body["chat_id"]
            chat = Chats.objects.get(user=req.user, chat_id=chat_id)
            user_return = {"content": chat.content}
            return JsonResponse({"response": user_return})
        except:
            return JsonResponse({"response": "Error"})


@login_required
def get_models(req):
    """
    Get list of available models

    Args:
        req (backend request): user request

    Returns:
        JsonResponse: {"response": either result or "Error"}
    """
    if req.method == "POST":
        try:
            body = json.loads(req.body)
            ollama_url = body["ollama_url"] + "/api/tags"
            result = []
            with requests.get(ollama_url) as response:
                response.raise_for_status()
                temp = response.json()
                model_list = temp["models"]
                for model in model_list:
                    result.append(model["name"])
            return JsonResponse({"response": result})
        except:
            return JsonResponse({"response": "Error"})


@login_required
def update_settings(req):
    """
    Update user settings

    Args:
        req (backend request): user request

    Returns:
        JsonResponse: {"response": either "Successful" or "Error"}
    """
    if req.method == "POST":
        try:
            body = json.loads(req.body)
            ollama_url = body["ollama_url"]
            search_url = body["search_url"]
            user_settings, created = Settings.objects.get_or_create(
                user=req.user,
                defaults={
                    "user": req.user,
                    "ollama_url": ollama_url,
                    "search_url": search_url,
                },
            )
            if created:
                pass
            else:
                user_settings.user = req.user
                user_settings.ollama_url = ollama_url
                user_settings.search_url = search_url
                user_settings.save()
            return JsonResponse({"response": "Successful"})
        except:
            return JsonResponse({"response": "Error"})


@login_required
def load_settings(req):
    """
    Load/Get user settings

    Args:
        req (backend request): user request

    Returns:
        JsonResponse: {"response": either {"ollama_url": user_settings.ollama_url, "api_url": user_settings.search_url} or "Error"}
    """
    if req.method == "GET":
        try:
            user_settings = Settings.objects.get(user=req.user)

            return JsonResponse(
                {
                    "response": {
                        "ollama_url": user_settings.ollama_url,
                        "api_url": user_settings.search_url,
                    }
                }
            )
        except:
            return JsonResponse({"response", "Error"})


def web_search(sear_xng_url: str, query: str, top_n: int = 5):
    """
    Web search

    Args:
        sear_xng_url (str): searxng url
        query (str): user's query
        top_n (int, optional): The amount of search results to return. Defaults to 5.

    Returns:
        json: search results
        or
        None
    """
    params = {"q": query, "format": "json"}
    try:
        response = requests.get(f"{sear_xng_url}/search", params=params, timeout=25)
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
        print(e)
        return None