import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

interface ChatHeaderProps {
  selected_model: string;
  on_model_change: (model: string) => void;
  model_list: Array<string>;
  on_logout: () => void;
}





export function ChatHeader({
  selected_model,
  on_model_change,
  model_list,
  on_logout,
}: ChatHeaderProps) {
  let models = [];

  for (const model of model_list) {
    models.push({ label: model, value: model });
  }
  return (
    <header className="border-b px-3 py-2 shrink-0">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Empty space for balance */}
        <div className="w-[100px]"></div>

        {/* Model Selector */}
        <div className="flex items-center gap-2">
          <Label
            htmlFor="model-select"
            className="text-muted-foreground text-sm"
          >
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

        {/* Logout Button */}
        <div className="w-[100px] flex justify-end">
          {on_logout && (
            <Button
              variant="ghost"
              size="sm"
              onClick={on_logout}
              className="h-8 gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
