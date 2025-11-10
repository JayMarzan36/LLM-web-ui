import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './main.tsx'
import './index.css'
import 'vite/modulepreload-polyfill'

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
)
