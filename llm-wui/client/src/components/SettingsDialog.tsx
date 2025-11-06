import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ollama_http: string;
  onollama_httpChange: (url: string) => void;
  api_url: string;
  on_api_url_change: (url: string) => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  ollama_http,
  onollama_httpChange,
  api_url,
  on_api_url_change,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
