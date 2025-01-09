import React, { useState } from 'react';
import StockForm from './components/StockForm';
import Login from './components/Login';
import Register from './components/Register';
import AlertTable from './components/AlertTable';
import HistoryPage from './components/HistoryPage';
import './App.css';


const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [token, setToken] = useState('');
  const [showHistory, setShowHistory] = useState(false);


  const handleSwitchToLogin = () => {
    setShowLogin(true);
  };

  const handleSwitchToRegister = () => {
    setShowLogin(false);
  };

  const handleLoginSuccess = (recievedToken) => {
    setToken(recievedToken)
    setAuthenticated(true)
  }

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
          // Authenticated
          <>
            {showHistory ? (
              // Show History Page
              <>
                <HistoryPage token={token} />
                <button onClick={() => setShowHistory(false)}>Back</button>
              </>
            ) : (
              // Show Alerts Page
              <>
                <button onClick={() => setShowHistory(true)}>History</button>
                <StockForm token={token} />
                <p className="warning">
                  Please be aware that this service only offers access to the American
                  stock exchanges.
                </p>
                <AlertTable token={token} />
              </>
            )}
          </>
        )}
      </div>
    );
  };
  
  export default App;