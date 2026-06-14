import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          fontFamily: 'Geist, system-ui, sans-serif',
          fontSize: '14px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px -8px rgb(41 37 36 / 0.20)',
        },
        success: { iconTheme: { primary: '#3d6347', secondary: '#fff' } },
        error:   { duration: 5000 },
      }}
    />
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
