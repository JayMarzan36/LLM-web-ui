import { toast } from "react-toastify";
import { use_fetch } from "../hooks/useFetch";
import { Message } from "../data/Message";
import { Chat } from "../data/Chat";

interface Model {
  id: string;
  name: string;
}

async function send_chat(
  user_message: Message,
  web_search: boolean,
  current_chat_id: string,
  message_counter: number,
  ollama_http: string,
  api_url: string,
  selected_model: string,
  set_message_counter: (value: number) => void,
  set_messages: (value: Message[]) => void,
  setIsLoading: (value: boolean) => void
) {

  try {
    const make_request = use_fetch();

    let response;
    const target_uri = "send_chat";

    const body = {
      chat_id: current_chat_id,
      counter: message_counter,
      ollama_url: ollama_http,
      search_web: web_search,
      search_web_url: api_url,
      model_name: selected_model,
      message: user_message,
    };

    response = await make_request(target_uri, "POST", body);

    if (response.ok) {
      const response_data = await response.json();
      set_message_counter(message_counter + 2);

      if (response_data["response"] === "Error getting response") {
        toast.error("Error searching web");
      } else if (response_data["response"] === "Error creating new chat") {
        toast.error("Error creating new chat");
      }

      const model_response = {
        id: Date.now().toString(),
        role: "assistant",
        content: response_data["response"],
      };
      set_messages((prev) => [...prev, model_response]);
    } else {
      toast.error("Error Talking with Model");
    }
    setIsLoading(false);
  } catch (error) {
    console.error("Error in send_chat:", error);
    toast.error("An unexpected error occurred.");
  }
}

async function delete_chat(chat_id: string) {
  const make_request = use_fetch();
  const response = await make_request("delete_chat", "DELETE", {
    chat_id: chat_id,
  });
  if (response.ok) {
    const temp = await response.json();
    const response_result = temp["response"];
    if (response_result === "Success") {
      toast.success("Deleted chat");
    } else {
      toast.error("Error deleting chat");
    }
  }
}

function get_first_four_words(str: string) {
  const words = str.split(" ");
  const numWords = Math.min(4, words.length);
  const firstFour = words.slice(0, numWords);
  let final_string = "";
  let counter = 0;
  for (let word of firstFour) {
    if (counter <= 0) {
      final_string += word;
    } else {
      final_string += " " + word;
    }
    counter++;
  }
  return final_string + "...";
}

async function get_chats(set_chats: (value: Chat[]) => void) {
  const make_request = use_fetch();
  const response = await make_request("get_chats", "GET", "");

  if (response.ok) {
    const temp = await response.json();
    const response_result = temp["response"];

    if (response_result === "Error") {
      toast.error("Error getting chat history");
    } else {
      const new_chats = response_result["user_chats"].map((chat) => ({
        id: chat["chat_id"],
        title: get_first_four_words(chat["title"]),
        timestamp: chat["time_stamp"],
      }));

      set_chats((prev) => [...new_chats, ...prev]);
    }
  }
}

async function load_chat(
  chat_id: string,
  chats: Chat[],
  set_messages: (value: Message[]) => void,
  set_message_counter: (value: number) => void
) {
  if (chats.length > 0) {
    const make_request = use_fetch();
    const body = {
      chat_id: chat_id,
    };
    const response = await make_request("load_chat", "POST", body);
    if (response.ok) {
      const temp = await response.json();
      const response_result = temp["response"];
      if (response_result === "Error") {
        toast.error("Error loading chat");
      } else {
        for (const message of response_result["content"]["messages"]) {
          set_messages((prev) => [...prev, message]);
          set_message_counter(message["id"] + 1);
        }
      }
    }
  }
}

async function get_models(
  ollama_http: string,
  set_models: (value: Array<String>) => void
) {
  const make_request = use_fetch();
  const target_uri = "get_models";
  const response = await make_request(target_uri, "POST", {
    ollama_url: ollama_http,
  });
  if (response.ok) {
    const temp = await response.json();
    const response_result = temp["response"];
    if (response_result === "Error") {
      toast.error("Error getting models");
    } else {
      set_models(response_result);
    }
  }
}

export { send_chat, delete_chat, get_chats, load_chat, get_models, get_first_four_words };
