import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./ui/button";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-md overflow-hidden my-3">
      <div className="flex items-center justify-between bg-zinc-800 px-3 py-2 text-xs">
        <span className="text-zinc-400">{language}</span>
        <Button
          onClick={handleCopy}
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-zinc-400 hover:text-white hover:bg-zinc-700"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          fontSize: "0.875rem",
          padding: "1rem",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
