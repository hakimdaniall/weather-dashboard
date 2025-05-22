// import { useState } from 'react';
import './App.css';
import Weather from './pages/Weather'

function App() {
  // const [inputLocation, setInputLocation] = useState('');
  // const [selectedLocation, setSelectedLocation] = useState('');

  return (
    <>
      {/* <div>
        <input
          type="text"
          value={inputLocation}
          onChange={(e) => setInputLocation(e.target.value)}
          placeholder="Enter location"
        />
        <button onClick={() => setSelectedLocation(inputLocation)}>
          Get Weather
        </button>
      </div> */}
      <Weather/>
    </>
  );
}

export default App;