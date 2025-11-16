import { toast } from "react-toastify";
import { use_fetch } from "../hooks/useFetch";

async function update_settings(ollama_http: string, api_url: string, style: string) {
  const make_request = use_fetch();
  const target_uri = "update_settings";
  const response = await make_request(target_uri, "POST", {
    ollama_url: ollama_http,
    search_url: api_url,
    style: style,
  });
  if (response.ok) {
    const temp = await response.json();
    const response_result = temp["response"];
    if (response_result === "Error") {
      toast.error("Error updating settings");
    } else {
      toast.success("Successfully updated settings");
    }
  }
}

async function load_settings(
  set_ollama_http: (value: string) => void,
  set_api_url: (value: string) => void,
  set_style: (value: "dark" | "light") => void,
  initial_settings: {}
) {
  const make_request = use_fetch();
  const target_uri = "load_settings";
  const response = await make_request(target_uri, "GET", "");
  if (response.ok) {
    const temp = await response.json();
    const response_result = temp["response"];
    if (response_result === "Error") {
      toast.error("Error loading settings");
    } else {
      set_ollama_http(response_result["ollama_url"]);
      set_api_url(response_result["api_url"]);
      set_style(response_result["style"]);
      initial_settings = {
        ollama_http: response_result["ollama_url"],
        api_url: response_result["api_url"],
      };
    }
  }
}

export { update_settings, load_settings };
