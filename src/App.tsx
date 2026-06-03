import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegistrationForm from './pages/RegistrationForm';
import StaffUI from './pages/StaffUI';
import Results from './pages/Results';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RegistrationForm />} />
        <Route path="/staff" element={<StaffUI />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
