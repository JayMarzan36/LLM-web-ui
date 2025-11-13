import { User, Bot, FileText } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { CodeBlock } from "./CodeBlock";
import { Attachment } from "../data/Message";
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
//TODO: make sure the content being displayed can be viewed and fit on a small window size

export function ChatMessage({ role, content, attachments }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex gap-3 px-3 py-4 ${
        isUser ? "bg-background" : "bg-muted/30"
      }`}
    >
      <div className="w-full max-w-screen-lg mx-auto flex gap-2 flex-wrap">
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

          {content === "...." && (
            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap bounce">
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
                        className="overflow-auto rounded-md max-w-full"
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
          )}

          {content !== "...." && (
            <div className=" max-w-full dark:prose-invert whitespace-pre-wrap mr-2 break-words">
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
                        className="overflow-auto rounded-md max-w-full"
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
          )}
        </div>
      </div>
    </div>
  );
}
