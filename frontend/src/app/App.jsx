import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext.jsx";
import Home from "../pages/Home.jsx";
import Login from "../pages/Login.jsx";
import Signup from "../pages/Signup.jsx";
import NavBar from "../components/NavBar.jsx";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
