import React, { useState } from 'react';
import StockForm from './components/StockForm';
import Login from './components/Login';
import Register from './components/Register';
import UserAlertsTable from './components/UserAlertsTable';
import HistoryPage from './components/HistoryPage';
import './App.css';


const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [currentPage, setCurrentPage] = useState('main')

  const handleSwitchToLogin = () => {
    setShowLogin(true);
  };

  const handleSwitchToRegister = () => {
    setShowLogin(false);
  };

  const navigateToHistory = () => {
    setCurrentPage('history');
  };

  const navigateToMain = () => {
    setCurrentPage('main');
  };

  return (
    <div>
      <h1 className="header">Stock Price Alert</h1>
      {!authenticated ? (
        <div className="container mt-5">
          {/* Conditionally render Login or Register */}
          {showLogin ? (
            <>
              {/* Pass setAuthenticated as a prop to handle login */}
              <Login setAuthenticated={setAuthenticated} />
              <div className="text-center mt-3">
                <p className='acc-txt'>
                  Don’t have an account?{' '}
                  <button
                    className="btn btn-link"
                    onClick={handleSwitchToRegister}
                  >
                    Register now
                  </button>
                </p>
              </div>
            </>
          ) : (
            <>
              <Register />
              <div className="text-center mt-3">
                <p className='acc-txt'>
                  Already have an account?{' '}
                  <button
                    className="btn btn-link"
                    onClick={handleSwitchToLogin}
                  >
                    Login here
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {currentPage === 'main' ? (
            <div className="container mt-5">
              <button onClick={navigateToHistory} className="btn btn-secondary mb-3">
                View History
              </button>
              <StockForm />
              <p className="warning">
                Please be aware that this service only offers access to the American
                stock exchanges.
              </p>
              <UserAlertsTable />
            </div>
          ) : (
            <HistoryPage navigateToMain={navigateToMain} />
          )}
        </>
      )}
    </div>
  );
};

export default App;
