import { useState, useEffect } from 'react'
import {ToastContainer, toast} from 'react-toastify';
import './App.css'

import { use_fetch } from "../src/hooks/useFetch";

function App() {
  const [model_name, set_model_name] = useState('');
  const [prompt, set_prompt] = useState('');
  const [output, set_output] = useState('');
  const [ollama_http, set_ollama_http] = useState('');
  const [web_search, set_web_search] = useState(false);
  const [web_search_url, set_web_search_url] = useState("");
  const [message_history, set_message_history] = useState([]);

  async function logout() {
    const res = await fetch("/registration/logout/", {
      credentials: "same-origin", // include cookies!
    });

    if (res.ok) {
      // navigate away from the single page app!
      window.location = "/registration/sign_in/";
    } else {
      // handle logout failed!
      toast.error("Failed to logout");
    }
  }

  async function send_chat(web_search) {
      // Make request to Ollama
    const make_request = use_fetch();

    let response;
    let target_uri;

    const body = {
      "ollama_url": ollama_http,
      "search_url": web_search_url,
      "search_web" : web_search,
      "model_name": model_name,
      "prompt": prompt
    }
    
    response = await make_request(target_uri, "POST", body);



    if (response.ok) {
      const response_data = await response.json();
      
      
    } else {
      toast.error("Error Talking with Model");
    }
  }

  useEffect(() => {
    if (prompt != '' && model_name != '' && ollama_http != '') {
      send_chat(web_search);

    }
  }, [prompt, model_name]);

  return (
    <>
      <title>Chat</title>
        <ToastContainer/>
      <div className="container">
        <div className="model-selection">
            <h3>Select Model:</h3>
            <select id="model-select">
                <option value="ollama">Ollama</option>
                <option value="searchxng">SearXNG</option>
            </select>
        </div>

        <div className="input-fields">
            <label for="ollama-prompt">Prompt:</label>
            <input type="text" id="ollama-prompt" placeholder="Enter your prompt"/>
        </div>

        <div className="chat-area">
            <div id="chat-output"></div>
        </div>

        <button id="send-button">Send</button>
      </div>
    </>
  )
}

export default App;