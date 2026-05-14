// Authentication Test Component
// This component helps verify all authentication features are working
import { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Button, Card } from '../components/common';

type TestResult = {
  test: string;
  success: boolean;
  message: string;
  timestamp: string;
};

const AuthTest = () => {
  const { user, signOut } = useAuthContext();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const addResult = (test: string, success: boolean, message = '') => {
    setTestResults((prev) => [
      ...prev,
      {
        test,
        success,
        message,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const runAuthTests = async () => {
    setRunning(true);
    setTestResults([]);

    try {
      // Test 1: Check if user is authenticated
      addResult('User Authentication', !!user, user ? 'User is logged in' : 'No user logged in');

      if (user) {
        // Test 2: Check Supabase connection
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        addResult(
          'Supabase Session',
          !sessionError && !!sessionData.session,
          sessionError ? sessionError.message : 'Session active'
        );

        // Test 3: Check user profile access
        const { error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        addResult(
          'Profile Access',
          !profileError || profileError.code === 'PGRST116',
          profileError && profileError.code !== 'PGRST116' ? profileError.message : 'Profile accessible'
        );

        // Test 4: Test database write access
        const testData = { id: user.id, full_name: 'Test User', timezone: 'UTC' };
        const { error: upsertError } = await supabase
          .from('user_profiles')
          .upsert(testData);

        addResult(
          'Database Write',
          !upsertError,
          upsertError ? upsertError.message : 'Can write to database'
        );

        // Test 5: Test sign out functionality
        await signOut();
        const { data: postSignOut } = await supabase.auth.getSession();
        addResult(
          'Sign Out',
          !postSignOut.session,
          !postSignOut.session ? 'Successfully signed out' : 'Sign out failed'
        );
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addResult('Test Execution', false, `Unexpected error: ${errorMessage}`);
    }

    setRunning(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Authentication Test Suite</h2>
        <p className="text-sm text-gray-600 mb-4">
          Run comprehensive tests to verify all authentication features are working properly.
        </p>

        <div className="flex space-x-3">
          <Button
            onClick={runAuthTests}
            variant="primary"
            disabled={running}
          >
            {running ? 'Running Tests...' : 'Run Auth Tests'}
          </Button>

          <Button
            onClick={clearResults}
            variant="outline"
          >
            Clear Results
          </Button>
        </div>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border ${
                  result.success
                    ? 'bg-mint/10 border-mint'
                    : 'bg-rose/10 border-rose'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{result.test}</span>
                  <span className={`text-sm ${result.success ? 'text-mint' : 'text-rose'}`}>
                    {result.success ? '✅ PASS' : '❌ FAIL'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                <p className="text-xs text-gray-500 mt-1">{result.timestamp}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between">
              <span className="font-medium">Overall Status</span>
              <span className={`font-bold ${
                testResults.every(r => r.success) ? 'text-mint' : 'text-rose'
              }`}>
                {testResults.every(r => r.success) ? 'All Tests Passed ✅' : 'Some Tests Failed ❌'}
              </span>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Test Checklist</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <span>🔐</span>
            <span>Sign up with new account</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🔑</span>
            <span>Login with existing credentials</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🔄</span>
            <span>Password reset flow (forgot password → email → reset)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>👤</span>
            <span>Profile editing and saving</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🚪</span>
            <span>Sign out functionality</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🛡️</span>
            <span>Protected routes (try accessing /home without login)</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AuthTest;