import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import Login from "../pages/Login.jsx";
import Signup from "../pages/Signup.jsx";
import Measurements from "../pages/Measurements.jsx";
import NewOrder from "../pages/NewOrder.jsx";
import MyOrders from "../pages/MyOrders.jsx";
import OrderDetail from "../pages/OrderDetail.jsx";
import Notifications from "../pages/Notifications.jsx";

// Role-dependent landing page; the admin side arrives in Task 13.
function Home() {
  const { user } = useAuth();
  if (user?.role === "admin") return <Navigate to="/admin/orders" replace />;
  return <Navigate to="/orders" replace />;
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
          <Route
            path="/measurements"
            element={
              <ProtectedRoute role="customer">
                <Measurements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/new"
            element={
              <ProtectedRoute role="customer">
                <NewOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute role="customer">
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute role="customer">
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute role="customer">
                <Notifications />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
