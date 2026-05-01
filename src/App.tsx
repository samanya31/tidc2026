import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegistrationForm from './pages/RegistrationForm';
import StaffUI from './pages/StaffUI';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RegistrationForm />} />
        <Route path="/staff" element={<StaffUI />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
