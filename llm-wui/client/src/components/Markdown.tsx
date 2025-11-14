import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className = "" }: MarkdownProps) {
  return (
    <div className={`markdown-container ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-4 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-3 mb-1">{children}</h3>
          ),

          p: ({ children }) => (
            <p className="leading-relaxed my-2 break-words">{children}</p>
          ),

          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              {children}
            </a>
          ),

          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");

            if (inline) {
              return (
                <code
                  className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm break-words"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <SyntaxHighlighter
                style={oneDark}
                language={match?.[1] ?? "text"}
                PreTag="div"
                className="rounded-lg overflow-x-auto my-3"
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            );
          },

          blockquote: ({ children }) => (
            <blockquote className="border-l-4 pl-3 text-gray-600 dark:text-gray-300 italic my-4">
              {children}
            </blockquote>
          ),

          ul: ({ children }) => (
            <ul className="list-disc ml-6 my-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal ml-6 my-2 space-y-1">{children}</ol>
          ),

          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-max border rounded">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border px-3 py-2 bg-gray-100 dark:bg-gray-800 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border px-3 py-2">{children}</td>
          ),

          img: ({ src, alt }) => (
            <img
              src={src ?? ""}
              alt={alt ?? ""}
              className="max-w-full rounded-md my-3 shadow"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
