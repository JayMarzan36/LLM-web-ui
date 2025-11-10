import { User, Bot, FileText } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { CodeBlock } from "./CodeBlock";
import { Attachment } from "../data/mockMessages";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
}

export function ChatMessage({ role, content, attachments }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex gap-3 px-3 py-4 ${
        isUser ? "bg-background" : "bg-muted/30"
      }`}
    >
      <div className="w-full max-w-4xl mx-auto flex gap-3">
        {/* Avatar */}
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback
            className={
              isUser ? "bg-primary text-primary-foreground" : "bg-secondary"
            }
          >
            {isUser ? (
              <User className="h-3.5 w-3.5" />
            ) : (
              <Bot className="h-3.5 w-3.5" />
            )}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2 overflow-hidden">
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
                      <span className="truncate max-w-[200px]">
                        {attachment.name}
                      </span>
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

          {/* Message content rendered like ChatGPT */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code
                      className="bg-muted px-1 py-0.5 rounded text-sm"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
