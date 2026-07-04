import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import './index.css'

function ThemedToaster() {
  const { isDark } = useTheme();
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          fontFamily: 'Geist, system-ui, sans-serif',
          fontSize: '14px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px -8px rgb(41 37 36 / 0.20)',
          background: isDark ? '#1c1917' : '#fff',
          color: isDark ? '#f5f5f4' : '#1c1917',
        },
        success: { iconTheme: { primary: '#3d6347', secondary: isDark ? '#1c1917' : '#fff' } },
        error:   { duration: 5000 },
      }}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ThemedToaster />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)
