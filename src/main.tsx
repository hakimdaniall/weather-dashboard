import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import WeatherQuery from './pages/WeatherQuery';
import WeatherVanilla from './pages/WeatherVanilla';
// import Weather from './pages/Weather';

import './index.css'
import './App.css';


const queryClient = new QueryClient(); // ✅ create a QueryClient instance

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}> {/* ✅ wrap everything */}
      <BrowserRouter>
        <Routes>
          {/* <Route path="/" element={<Weather />} /> */}
          <Route path="/" element={<Navigate to="/weather/query" replace />} />

          <Route path="/weather/query" element={<WeatherQuery />} />
          <Route path="/weather/vanilla" element={<WeatherVanilla />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);