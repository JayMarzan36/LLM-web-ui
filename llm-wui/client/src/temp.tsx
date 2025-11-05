import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { ChatHeader } from "./components/ChatHeader";
import { ChatHistory } from "./components/ChatHistory";
import { SettingsDialog } from "./components/SettingsDialog";
import { ScrollArea } from "./components/ui/scroll-area";
import { initialMessages, Message, Attachment } from "./data/mockMessages";
import { Chat, mockChats } from "./data/mockChats";

import { ToastContainer, toast } from "react-toastify";

import { use_fetch } from "./hooks/useFetch";

export default function TApp() {
  const [messages, set_messages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected_model, set_selected_model] = useState("gemma3:4b");
  const [web_search, set_web_search] = useState(false);
  const [current_chat_id, set_current_chat_id] = useState("0");
  const [chats, set_chats] = useState<Chat[]>([]);
  const [settings_open, set_settings_open] = useState(false);
  const [ollama_http, set_ollama_http] = useState("http://127.0.0.1:11434");
  const [api_url, set_api_url] = useState("");
  const [message_counter, set_message_counter] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [model_name, set_model_name] = useState("");
  const [prompt, set_prompt] = useState("");
  const [output, set_output] = useState("");
  const [web_search_url, set_web_search_url] = useState("");
  const [message_history, set_message_history] = useState([]);

  // TODO: fix logout function
  // TODO: add logout button
  // async function logout() {
  //     const res = await fetch("/registration/logout/", {
  //     credentials: "same-origin", // include cookies!
  //     });

  //     if (res.ok) {
  //       // navigate away from the single page app!
  //       window.location = "/registration/sign_in/";
  //     } else {
  //       // handle logout failed!
  //       toast.error("Failed to logout");
  //     }
  //   }

  async function send_chat(user_message: Message, web_search: boolean) {
    const make_request = use_fetch();

    let response;
    const target_uri = "send_chat"

    const body = {
      chat_id: current_chat_id,
      counter: message_counter,
      ollama_url: ollama_http,
      search_url: web_search_url,
      search_web: web_search,
      model_name: selected_model,
      message: user_message,
    };

    response = await make_request(target_uri, "POST", body);

    if (response.ok) {
      const response_data = await response.json();
      const model_response = {
        id: Date.now().toString(),
        role: "assistant",
        content: response_data["response"]
      }
      set_messages((prev) => [...prev, model_response])

    } else {
      toast.error("Error Talking with Model");
    }
    setIsLoading(false);
  }

  async function delete_chat(chat_id: string) {
    const make_request = use_fetch();
    const response = await make_request("delete_chat", "DELETE", {"chat_id":chat_id});
    if (response.ok) {
      const temp = await response.json()
      const response_result = temp["response"]
      if (response_result === "Success") {
        toast.success("Deleted chat")
      } else {
        toast.error("Error deleting chat")
      }
    }
  }

  const scroll_to_bottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scroll_to_bottom();
  }, [messages]);

  const handle_new_chat = () => {
    const newChat = {
      id: current_chat_id,
      title: "New Chat",
      timestamp: new Date(),
    };
    set_chats((prev) => [newChat, ...prev]);
    set_current_chat_id(newChat.id + 1);
  };

  const handle_select_chat = (chat_id: string) => {
    set_current_chat_id(chat_id);
    // In a real app, you would load the messages for this chat
    //TODO: Add function for loading message from database
  };

  const handle_delete_chat = (chat_id: string) => {
    set_chats((prev) => prev.filter((chat) => chat.id !== chat_id));
    delete_chat(chat_id)
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
      content,
      attachments,
    };
    set_message_counter(user_message.id + 1)
    if (chats.length === 0) {
      handle_new_chat();
    }
    set_messages((prev) => [...prev, user_message]);
    setIsLoading(true);
    send_chat(user_message, web_search);
  };

  return (
    <div className="flex h-full min-h-screen bg-background">
      <ToastContainer/>
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
        />

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div ref={scrollRef} className="min-h-full">
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
