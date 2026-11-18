import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import Login from "../pages/Login.jsx";
import Signup from "../pages/Signup.jsx";

// Role-dependent landing page, built out in Tasks 12/13.
function Home() {
  return <div className="p-8">Signed in.</div>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
