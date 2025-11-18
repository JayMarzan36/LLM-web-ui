from django.shortcuts import render
from django.conf import settings
import json
import datetime
import os
import requests
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from core.models import Chats, Settings
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from PyPDF2 import PdfReader
import base64

MANIFEST = {}
if not settings.DEBUG:
    # Prefer the collected STATIC_ROOT/manifest.json (where the Docker build copies files).
    manifest_path = os.path.join(settings.STATIC_ROOT, "manifest.json")
    # Fallback to the old location if present in the source tree.
    if not os.path.exists(manifest_path):
        manifest_path = os.path.join(
            settings.BASE_DIR, "core", "static", "manifest.json"
        )
        # Vite may write `manifest.json` either at the root of the build folder
        # or under a `.vite/` subfolder. Check multiple candidate locations so
        # the server can find the manifest regardless of how Vite was configured.
        candidates = [
            os.path.join(settings.STATIC_ROOT, "manifest.json"),
            os.path.join(settings.STATIC_ROOT, ".vite", "manifest.json"),
            os.path.join(settings.STATIC_ROOT, "core", "manifest.json"),
            os.path.join(settings.STATIC_ROOT, "core", ".vite", "manifest.json"),
            os.path.join(settings.BASE_DIR, "core", "static", "manifest.json"),
            os.path.join(
                settings.BASE_DIR, "core", "static", "core", ".vite", "manifest.json"
            ),
        ]

        manifest_path = None
        for candidate in candidates:
            if candidate and os.path.exists(candidate):
                manifest_path = candidate
                break

        if manifest_path:
            try:
                with open(manifest_path, "r", encoding="utf-8") as f:
                    MANIFEST = json.load(f)
            except Exception:
                MANIFEST = {}
        else:
            MANIFEST = {}

    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            MANIFEST = json.load(f)
    except Exception:
        MANIFEST = {}


def extract_text_from_file(file_path: str) -> str:
    """
    Extract readable text from a file based on its type.

    Args:
        file_path (str): file path

    Returns:
        str: contents of the file
    """
    extension = os.path.splitext(file_path)[1].lower()
    try:
        if extension in [
            ".txt",
            ".py",
            ".csv",
            ".json",
            ".md",
            ".cpp",
            ".json",
            ".js",
            ".jsx",
            ".tsx",
            ".html",
            ".css",
        ]:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        elif extension == ".pdf":
            reader = PdfReader(file_path)
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        else:
            return f"[Unsupported file type: {extension}]"
    except Exception as e:
        return f"[Error reading file: {e}]"


@login_required
def index(req):
    # determine the manifest key for the main entry (support jsx/ts variants)
    js_key = None
    for candidate in ("src/main.jsx", "src/main.ts", "src/main.tsx", "src/main.js"):
        if candidate in MANIFEST:
            js_key = candidate
            break

    js_file = ""
    css_file = ""
    if not settings.DEBUG and js_key:
        entry = MANIFEST.get(js_key, {})
        js_file = entry.get("file", "")
        css_list = entry.get("css", [])
        css_file = css_list[0] if css_list else ""

    # Only use ASSET_URL when in DEBUG (development); in production we serve local static files
    asset_url = os.environ.get("ASSET_URL", "") if settings.DEBUG else ""

    context = {
        "asset_url": asset_url,
        "debug": settings.DEBUG,
        "manifest": MANIFEST,
        "js_file": js_file,
        "css_file": css_file,
    }
    return render(req, "core/index.html", context)


@login_required
def delete_chat(req):
    """ "
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

    prompt = "You are a helpful assistant and your response should be in the format of markdown.  Consider the following conversation history:\n"
    for message in previous_chats:
        prompt += f"User: {message['content']}\n"

        prompt += f"Assistant: {message['content']}\n"

    prompt += f"User: {body['message']}\n"

    prompt += "Assistant:\n"

    if body["search_web"]:
        search_result = web_search(web_url, body["message"]["content"])
        print(search_result)
        if search_result == None:
            search_result = "No search results"

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
    if req.method == "POST":
        body = json.loads(req.body)

        current_chat_id = body["chat_id"]

        interaction_counter = body["counter"]

        web_url = body["search_web_url"]

        ollama_url = body["ollama_url"] + "/api/generate"

        user_message = body["message"]

        file_directory = os.path.join(
            settings.BASE_DIR, f"document_storage/f{req.user}"
        )
        os.makedirs(file_directory, exist_ok=True)

        attachments = user_message.get("attachments", [])

        attachment_texts = []

        for i, attachment in enumerate(attachments):
            file_data = attachment.get("file", "")

            file_ext = attachment.get("extension", "")

            file_name = attachment.get("name", f"attachment_{i}.{file_ext}")

            if not file_data:
                continue

            try:
                file_bytes = base64.b64decode(file_data)

            except Exception as e:
                print(f"Error decoding file: {e}")

                continue

            temp_path = os.path.join(
                file_directory,
                f"{req.user}_{current_chat_id}_{interaction_counter}_{file_name}",
            )
            with open(temp_path, "wb") as f:
                f.write(file_bytes)

            extracted_text = extract_text_from_file(temp_path)

            if extracted_text:
                attachment_texts.append(extracted_text)

        retrieved_chunks = []

        if attachment_texts:
            all_text = "\n\n".join(attachment_texts)

            splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000, chunk_overlap=200
            )
            docs = splitter.create_documents([all_text])

            try:
                embeddings = OllamaEmbeddings(model="embeddinggemma:300m")

                vector_store = FAISS.from_documents(docs, embeddings)

                retriever = vector_store.as_retriever(search_kwargs={"k": 5})

                query = user_message.get("content", "")

                results = retriever.invoke(query)

                retrieved_chunks = [doc.page_content for doc in results]

            except Exception as e:
                print(f"Embedding or retrieval error: {e}")

        payload = generate_llm_prompt(req, current_chat_id, body, web_url)

        if retrieved_chunks:
            payload[
                "prompt"
            ] += (
                "\n\nThe following information was retrieved from uploaded documents:\n"
            )

            payload["prompt"] += "\n---\n".join(retrieved_chunks)

        elif attachment_texts:
            payload["prompt"] += "\n\nThe user also uploaded the following files:\n"

            payload["prompt"] += "\n".join(attachment_texts[:2])

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

                output = output.strip()

            current_chat, created = Chats.objects.get_or_create(
                chat_id=current_chat_id,
                user=req.user,
                defaults={
                    "content": {"messages": []},
                    "time_stamp": datetime.datetime.now(),
                    "title": user_message["content"],
                },
            )

            if "messages" not in current_chat.content or not isinstance(
                current_chat.content["messages"], list
            ):
                current_chat.content["messages"] = []

            current_chat.content["messages"].append(
                {
                    "id": interaction_counter,
                    "role": "user",
                    "content": user_message["content"],
                    "attachments": [a["name"] for a in attachments],
                }
            )
            current_chat.content["messages"].append(
                {
                    "id": interaction_counter + 1,
                    "role": "assistant",
                    "content": output,
                }
            )
            current_chat.save()

            return JsonResponse({"response": output})
        except requests.exceptions.RequestException as e:
            print("Ollama error:", e)
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
            style = body["style"]
            user_settings, created = Settings.objects.get_or_create(
                user=req.user,
                defaults={
                    "user": req.user,
                    "ollama_url": ollama_url,
                    "search_url": search_url,
                    "style": "light",
                },
            )
            if created:
                pass
            else:
                user_settings.user = req.user
                user_settings.ollama_url = ollama_url
                user_settings.search_url = search_url
                user_settings.style = style
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
            user_settings, created = Settings.objects.get_or_create(
                user=req.user,
                defaults={
                    "user": req.user,
                    "ollama_url": "http://127.0.0.1:11434",
                    "search_url": "",
                    "style": "light",
                },
            )

            return JsonResponse(
                {
                    "response": {
                        "ollama_url": user_settings.ollama_url,
                        "api_url": user_settings.search_url,
                        "style": user_settings.style,
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
