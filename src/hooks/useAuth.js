import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const validateToken = async (token) => {
    try {
      const res = await fetch('http://localhost:5031/api/Productos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsValidating(false);
        return;
      }

      const isValid = await validateToken(token);
      if (!isValid) {
        localStorage.removeItem('token');
      }
      
      setIsAuthenticated(isValid);
      setIsValidating(false);
    };

    checkAuth();
  }, []);

  return { isValidating, isAuthenticated };
};
