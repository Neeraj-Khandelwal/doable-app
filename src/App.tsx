import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { FamilyProvider } from './context/FamilyContext';
import { TaskProvider } from './context/TaskContext';
import { HabitProvider } from './context/HabitContext';
import { RewardsProvider } from './context/RewardsContext';
import { FastingProvider } from './context/FastingContext';
import { GroceryProvider } from './context/GroceryContext';
import { AlarmProvider } from './context/AlarmContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Habits from './pages/Habits';
import Rewards from './pages/Rewards';
import Alarms from './pages/Alarms';
import Fasting from './pages/Fasting';
import Grocery from './pages/Grocery';
import Family from './pages/Family';
import FamilySetup from './pages/FamilySetup';
import JoinFamily from './pages/FamilySetup/JoinFamily';
import FamilySettings from './pages/Family/Settings';
import VoiceCapture from './pages/Voice/VoiceCapture';
import TestVoice from './pages/Voice/TestVoice';


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/home" element={<ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Layout><Tasks /></Layout></ProtectedRoute>} />
      <Route path="/habits" element={<ProtectedRoute><Layout><Habits /></Layout></ProtectedRoute>} />
      <Route path="/rewards" element={<ProtectedRoute><Layout><Rewards /></Layout></ProtectedRoute>} />
      <Route path="/alarms" element={<ProtectedRoute><Layout><Alarms /></Layout></ProtectedRoute>} />
      <Route path="/fasting" element={<ProtectedRoute><Layout><Fasting /></Layout></ProtectedRoute>} />
      <Route path="/grocery" element={<ProtectedRoute><Layout><Grocery /></Layout></ProtectedRoute>} />
      <Route path="/family" element={<ProtectedRoute><Layout><Family /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<Navigate to="/family" />} />
      <Route path="/join" element={<ProtectedRoute><JoinFamily /></ProtectedRoute>} />
      <Route path="/family/settings" element={<ProtectedRoute><FamilySettings /></ProtectedRoute>} />
      <Route path="/family-setup" element={<ProtectedRoute><FamilySetup /></ProtectedRoute>} />
      <Route path="/voice-capture" element={<ProtectedRoute><VoiceCapture /></ProtectedRoute>} />
      <Route path="/test-voice" element={<ProtectedRoute><TestVoice /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/home" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <FamilyProvider>
        <TaskProvider>
          <HabitProvider>
            <RewardsProvider>
              <FastingProvider>
              <GroceryProvider>
              <AlarmProvider>
                <Router>
                  <div className="App">
                    <AppRoutes />
                  </div>
                </Router>
              </AlarmProvider>
              </GroceryProvider>
              </FastingProvider>
            </RewardsProvider>
          </HabitProvider>
        </TaskProvider>
      </FamilyProvider>
    </AuthProvider>
  );
}

export default App;
