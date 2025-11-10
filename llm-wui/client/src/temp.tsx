import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { ChatHeader } from "./components/ChatHeader";
import { ChatHistory } from "./components/ChatHistory";
import { SettingsDialog } from "./components/SettingsDialog";
import { ScrollArea } from "./components/ui/scroll-area";
import { initialMessages, Message, Attachment } from "./data/mockMessages";
import { Chat, mockChats } from "./data/mockChats";
import { send_chat, delete_chat, get_chats, load_chat, get_models } from "./components/chat_functions";
import { ToastContainer, toast } from "react-toastify";

import { use_fetch } from "./hooks/useFetch";

export default function TApp() {
  const [messages, set_messages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected_model, set_selected_model] = useState("");
  const [web_search, set_web_search] = useState(false);
  const [current_chat_id, set_current_chat_id] = useState("0");
  const [chats, set_chats] = useState<Chat[]>([]);
  const [settings_open, set_settings_open] = useState(false);
  const [ollama_http, set_ollama_http] = useState("http://127.0.0.1:11434");
  const [api_url, set_api_url] = useState("");
  const [message_counter, set_message_counter] = useState(0);
  const [settings_loaded, set_settings_loaded] = useState(false);
  let initial_settings = useRef({ ollama_http: "", api_url: "" });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [models, set_models] = useState([]);

  // TODO: fix logout function
  // TODO: add logout button
  async function logout() {
    try {
      const res = await fetch("/registration/logout/", {
        method: "POST",
        credentials: "same-origin",
      });

      if (res.ok) {
        window.location.href = "/registration/sign_in/";
      } else {
        toast.error("Failed to logout");
      }
    } catch (err) {
      toast.error("Logout failed due to network error");
    }
  }

  

  async function update_settings() {
    const make_request = use_fetch();
    const target_uri = "update_settings";
    const response = await make_request(target_uri, "POST", {
      ollama_url: ollama_http,
      search_url: api_url,
    });
    if (response.ok) {
      const temp = await response.json();
      const response_result = temp["response"];
      if (response_result === "Error") {
        toast.error("Error updating settings");
      } else {
        toast.success("Successfully updated settings");
      }
    }
  }

  async function load_settings() {
    const make_request = use_fetch();
    const target_uri = "load_settings";
    const response = await make_request(target_uri, "GET", "");
    if (response.ok) {
      const temp = await response.json();
      const response_result = temp["response"];
      if (response_result === "Error") {
        toast.error("Error loading settings");
      } else {
        set_ollama_http(response_result["ollama_url"]);
        set_api_url(response_result["api_url"]);
        initial_settings = {
          ollama_http: response_result["ollama_url"],
          api_url: response_result["api_url"],
        };
      }
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handle_new_chat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: "New Chat",
      timestamp: new Date(),
    };
    set_chats((prev) => [newChat, ...prev]);
    set_current_chat_id(newChat.id);
    set_messages([]);
    set_message_counter(0);
  };

  const handle_select_chat = (chat_id: string) => {
    set_current_chat_id(chat_id);
    set_messages([]);
    load_chat(chat_id);
  };

  const handle_delete_chat = (chat_id: string) => {
    set_chats((prev) => prev.filter((chat) => chat.id !== chat_id));
    delete_chat(chat_id);
    if (chat_id === current_chat_id) {
      const remainingChats = chats.filter((chat) => chat.id !== chat_id);
      if (remainingChats.length > 0) {
        set_current_chat_id(remainingChats[0].id);
      } else {
        handle_new_chat();
      }
    }
  };

  const handle_send_message = (content: string, attachments?: Attachment[]) => {
    const user_message = {
      id: message_counter,
      role: "user",
      content: content,
      attachments,
    };
    set_messages((prev) => [...prev, user_message]);
    setIsLoading(true);
    send_chat(user_message, web_search, current_chat_id, message_counter, ollama_http, api_url, selected_model, set_message_counter, set_messages, setIsLoading);
    if (!current_chat_id) {
      handle_new_chat();
    }
  };

  useEffect(() => {
    get_chats(set_chats);
    load_settings().then(() => {
      set_settings_loaded(true);
    });
  }, []);

  useEffect(() => {
    get_models(ollama_http, set_models);
  }, [ollama_http]);

  useEffect(() => {
    if (!settings_loaded) return;
    const changed =
      ollama_http !== initial_settings.current.ollama_http ||
      api_url !== initial_settings.current.api_url;
    if (changed) {
      update_settings();
    }
  }, [ollama_http, api_url, settings_loaded]);

  return (
    <div className="flex h-full min-h-screen bg-background dark">
      <ToastContainer />
      {/* Sidebar */}
      <div className="w-64 shrink-0">
        <ChatHistory
          chats={chats}
          current_chat_id={current_chat_id}
          onSelectChat={handle_select_chat}
          onNewChat={handle_new_chat}
          onOpenSettings={() => set_settings_open(true)}
          onDeleteChat={handle_delete_chat}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <ChatHeader
          selected_model={selected_model}
          on_model_change={set_selected_model}
          model_list={models}
          on_logout={logout}
        />

        {/* Messages */}
        <ScrollArea
          className="flex-1 overflow-y-auto"
          view_port_ref={scrollRef}
        >
          <div className="min-h-full">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                attachments={message.attachments}
              />
            ))}
            {isLoading && <ChatMessage role="assistant" content="....." />}
          </div>
        </ScrollArea>

        {/* Input */}
        <ChatInput
          onSendMessage={handle_send_message}
          disabled={isLoading}
          web_search={web_search}
          onWebSearchChange={set_web_search}
        />
      </div>

      {/* Settings Dialog */}
      <SettingsDialog
        open={settings_open}
        onOpenChange={set_settings_open}
        ollama_http={ollama_http}
        onollama_httpChange={set_ollama_http}
        api_url={api_url}
        on_api_url_change={set_api_url}
      />
    </div>
  );
}
