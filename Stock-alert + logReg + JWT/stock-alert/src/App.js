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
  const [showHelp, setShowHelp] = useState(false)

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

  const toggleHelp = () => {
    setShowHelp((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:5000/logout', {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        if (response.ok) {
          setAuthenticated(false);
          setShowLogin(true);    
          setCurrentPage('main');  
        }
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div>
      <h1 className="header">Stock Price Alert</h1>
      {authenticated && (
        <button className="help-button" onClick={toggleHelp}>
          ?
        </button>
      )}
      {authenticated && (
        <button onClick={navigateToHistory} className="btn btn-secondary mb-3">
          View History
        </button>
      )}
      {authenticated && (
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      )}
      {showHelp && (
        <div className="help-overlay">
          <div className="help-content">
            <h3>How to Use This Site</h3>
            <p>
              1. Enter a stock symbol and set high or low alert price.<br/>
              2. You will recieve an email when this price is reached<br/>
              3. You can view your active alerts below.<br/> 
              4. You can edit by clicking on them or delete them as needed.<br/>
              5. To view past triggered alerts use the "History" button.<br/>
              6. You can delete or sort your history as required.<br/>
              7. Click this "?" again or "Close" to hide help.
            </p>
            <button onClick={toggleHelp} className='close-button'>Close</button>
          </div>
        </div>
      )}
      {!authenticated ? (
        <div className={`container mt-5 ${showHelp ? 'blur' : ''}`}>
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
