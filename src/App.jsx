import './App.css';
import {Routes, Route } from 'react-router-dom';
import HomePage from './page/Home';
import GameCanvas from './components/GameCanvas';

function App() {
  return (
    <>
        {/* Routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game" element={<GameCanvas />} />
        </Routes>
      </>
  );
}

export default App;