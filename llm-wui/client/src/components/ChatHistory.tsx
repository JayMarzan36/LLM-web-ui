import { MessageSquare, Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
}

interface ChatHistoryProps {
  chats: Chat[];
  current_chat_id: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onDeleteChat: (id: string) => void;
}

export function ChatHistory({
  chats,
  current_chat_id,
  onSelectChat,
  onNewChat,
  onOpenSettings,
  onDeleteChat,
}: ChatHistoryProps) {
  const handleDelete = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    onDeleteChat(chatId);
  };

  return (
    <div className="flex flex-col h-full border-r bg-muted/30">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between gap-2">
        <Button
          onClick={onNewChat}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
        <Button
          onClick={onOpenSettings}
          variant="ghost"
          size="sm"
          className="shrink-0"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chats.length > 0 && chats.map((chat) => (
            <div
              key={chat.id}
              className="group relative"
            >
              <Button
                onClick={() => onSelectChat(chat.id)}
                variant={current_chat_id === chat.id ? "secondary" : "ghost"}
                className="w-full justify-start text-left h-auto py-2 px-3 pr-10"
              >
                <MessageSquare className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate text-sm">{chat.title}</span>
              </Button>
              <Button
                onClick={(e) => handleDelete(e, chat.id)}
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete chat"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
