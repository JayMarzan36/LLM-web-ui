import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Save } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ollama_http: string;
  onollama_httpChange: (url: string) => void;
  api_url: string;
  on_api_url_change: (url: string) => void;
  save_settings: (url_1: string, url_2: string) => void;
  set_models: (value: Array<String>) => void;
  get_models: (value_1: string, value_2: (value: Array<String>) => void) => void;
  style: string;
}

export function SettingsDialog({
  open,
  onOpenChange,
  ollama_http,
  onollama_httpChange,
  api_url,
  on_api_url_change,
  save_settings,
  set_models,
  get_models,
  style
}: SettingsDialogProps) {
  //TODO: Add setting for saving whether or not the user is using dark mode or light mode
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-[500px] ${style === "dark" ? "dark" : "light"}`}>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your API endpoints and connection settings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ollama-url">Ollama API URL</Label>
            <Input
              id="ollama-url"
              placeholder="http://localhost:11434"
              value={ollama_http}
              onChange={(e) => onollama_httpChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The URL where your Ollama instance is running
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-url">Web Search API URL</Label>
            <Input
              id="api-url"
              placeholder="https://api.example.com"
              value={api_url}
              onChange={(e) => on_api_url_change(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The URL where your SearXNG is running.
            </p>
          </div>
          <div className="space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => {
                      save_settings(ollama_http, api_url);
                      get_models(ollama_http, set_models);
                    }}
                    className="h-[44px] w-[44px]"
                    size="icon"
                    aria-label="Save"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Save settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
