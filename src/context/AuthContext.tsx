import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Employee, UserRole } from '../services/types';
import { getEmployees, registerEmployee, initializeDatabase, checkOverdueAllocations } from '../services/api';

interface AuthContextType {
  currentUser: Employee | null;
  currentRole: UserRole | null;
  loading: boolean;
  login: (email: string) => Promise<Employee>;
  signup: (name: string, email: string, departmentId: string) => Promise<Employee>;
  logout: () => void;
  overrideRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Make sure DB matches defaults on load
    initializeDatabase();
    checkOverdueAllocations();

    // Check if session exists in sessionStorage
    const savedUser = sessionStorage.getItem('eam_session_user');
    const savedRole = sessionStorage.getItem('eam_session_role');

    if (savedUser) {
      const parsedUser = JSON.parse(savedUser) as Employee;
      setCurrentUser(parsedUser);
      // Use override role if saved, else default employee role
      setCurrentRole((savedRole as UserRole) || parsedUser.role);
    }
    setLoading(false);
  }, []);

  const login = async (email: string): Promise<Employee> => {
    setLoading(true);
    try {
      const employees = getEmployees();
      const match = employees.find(e => e.email.toLowerCase() === email.trim().toLowerCase());

      if (!match) {
        throw new Error('No user found with that email address.');
      }

      setCurrentUser(match);
      setCurrentRole(match.role);
      sessionStorage.setItem('eam_session_user', JSON.stringify(match));
      sessionStorage.setItem('eam_session_role', match.role);
      return match;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, departmentId: string): Promise<Employee> => {
    setLoading(true);
    try {
      // The registerEmployee function automatically forces role: 'Employee'
      const newEmp = registerEmployee(name, email, departmentId);
      setCurrentUser(newEmp);
      setCurrentRole(newEmp.role);
      sessionStorage.setItem('eam_session_user', JSON.stringify(newEmp));
      sessionStorage.setItem('eam_session_role', newEmp.role);
      return newEmp;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentRole(null);
    sessionStorage.removeItem('eam_session_user');
    sessionStorage.removeItem('eam_session_role');
  };

  const overrideRole = (role: UserRole) => {
    if (currentUser) {
      setCurrentRole(role);
      sessionStorage.setItem('eam_session_role', role);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, currentRole, loading, login, signup, logout, overrideRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
