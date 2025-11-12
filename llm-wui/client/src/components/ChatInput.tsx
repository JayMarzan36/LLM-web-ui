import { useState, KeyboardEvent, useRef } from "react";
import { Send, Globe, Paperclip, X } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Attachment } from "../data/Message";

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: Attachment[]) => void;
  disabled?: boolean;
  web_search: boolean;
  onWebSearchChange: (enabled: boolean) => void;
  selected_model: string;
  api_url: string
}

export function ChatInput({
  onSendMessage,
  disabled,
  web_search,
  onWebSearchChange,
  selected_model,
  api_url
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((message.trim() || attachments.length > 0) && !disabled) {
      onSendMessage(message, attachments.length > 0 ? attachments : undefined);
      setMessage("");
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (selected_model !== "") {
        handleSend();
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = await Promise.all(Array.from(files).map(async (file) => {
      const file_buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(file_buffer);
      const base64String = btoa(String.fromCharCode(...uint8Array));
      return {
      id: Math.random().toString(36).substring(7),
      name: file.name,
      file: base64String,
      size: file.size,
      };
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  return (
    <div className="border-t bg-background p-3">
      <div className="max-w-4xl mx-auto">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="relative group inline-flex items-center gap-2 px-2 py-1 bg-muted rounded-md border text-xs"
              >
                <Paperclip className="h-3 w-3" />
                <span className="truncate max-w-[150px]">
                  {attachment.name}
                </span>
                <Button
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            className="min-h-[44px] max-h-[200px] resize-none text-sm"
            disabled={disabled}
          />
          <div className="flex gap-2 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.py,.cpp,.md,.json,.tsx,.jsx,.html,.css,.js"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="icon"
                    className="h-[44px] w-[44px]"
                    disabled={disabled}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Attach file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onWebSearchChange(!web_search)}
                    variant={web_search ? "default" : "outline"}
                    size="icon"
                    className="h-[44px] w-[44px]"
                    disabled={api_url === "" ? true : disabled}
                    aria-label="Toggle web search"
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {web_search ? "Web Search: ON" : "Web Search: OFF"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              onClick={handleSend}
              disabled={
                selected_model === "" ? true : selected_model !== "" ? (!message.trim() && attachments.length === 0) : disabled
              }
              size="icon"
              className="h-[44px] w-[44px]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
