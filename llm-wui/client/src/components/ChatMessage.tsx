import { User, Bot, FileText } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { CodeBlock } from "./CodeBlock";
import { Attachment } from "../data/mockMessages";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
}

function parseMessageContent(content: string) {
  const parts: Array<{ type: "text" | "code"; content: string; language?: string }> = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex, match.index),
      });
    }

    // Add code block
    parts.push({
      type: "code",
      language: match[1] || "plaintext",
      content: match[2].trim(),
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      content: content.slice(lastIndex),
    });
  }

  return parts.length > 0 ? parts : [{ type: "text" as const, content }];
}

export function ChatMessage({ role, content, attachments }: ChatMessageProps) {
  const isUser = role === "user";
  const parts = parseMessageContent(content);

  return (
    <div className={`flex gap-3 px-3 py-4 ${isUser ? "bg-background" : "bg-muted/30"}`}>
      <div className="w-full max-w-4xl mx-auto flex gap-3">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className={isUser ? "bg-primary text-primary-foreground" : "bg-secondary"}>
            {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1 overflow-hidden">
          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((attachment) => (
                <div key={attachment.id}>
                  {attachment.type === "image" ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="max-w-xs max-h-64 rounded-md border"
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md border text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{attachment.name}</span>
                      {attachment.size && (
                        <span className="text-xs text-muted-foreground">
                          ({(attachment.size / 1024).toFixed(1)} KB)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Message content with code blocks */}
          <div>
            {parts.map((part, index) => (
              <div key={index}>
                {part.type === "text" ? (
                  <p className="whitespace-pre-wrap break-words text-sm">{part.content}</p>
                ) : (
                  <CodeBlock language={part.language || "plaintext"} code={part.content} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
