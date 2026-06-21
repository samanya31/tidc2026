import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegistrationForm from './pages/RegistrationForm';
import StaffUI from './pages/StaffUI';
import Results from './pages/Results';
import Poll from './pages/Poll';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RegistrationForm />} />
        <Route path="/staff" element={<StaffUI />} />
        <Route path="/results" element={<Results />} />
        <Route path="/vote" element={<Poll />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
