import React from "react";
import { Navigate } from "react-router-dom";

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem("authToken");

  if (!token) return <Navigate to="/login" replace />;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("authToken");
      return <Navigate to="/login" replace />;
    }
  } catch (err) {
    localStorage.removeItem("authToken");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RequireAuth;
