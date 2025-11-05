import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import TApp from './temp.tsx'
import './index.css'
import 'vite/modulepreload-polyfill'

ReactDOM.createRoot(document.getElementById('root')).render(
    <TApp />
)
