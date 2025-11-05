import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";

interface ChatHeaderProps {
  selected_model: string;
  on_model_change: (model: string) => void;
}

// TODO: Get list of models from Ollama via back end


const models = [
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
  { value: "gemini-pro", label: "Gemini Pro" },
  { value: "llama-3", label: "Llama 3" },
];

export function ChatHeader({
  selected_model,
  on_model_change,
}: ChatHeaderProps) {
  return (
    <header className="border-b px-3 py-2 shrink-0">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
        {/* Model Selector */}
        <div className="flex items-center gap-2">
          <Label htmlFor="model-select" className="text-muted-foreground text-sm">
            Model
          </Label>
          <Select value={selected_model} onValueChange={on_model_change}>
            <SelectTrigger id="model-select" className="w-[160px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
