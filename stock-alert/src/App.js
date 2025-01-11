import React, { useState, useContext } from 'react';
import StockForm from './components/StockForm';
import Login from './components/Login';
import Register from './components/Register';
import AlertTable from './components/AlertTable';
import HistoryPage from './components/HistoryPage';
import { AuthContext } from './AuthContext';
import './App.css';


const App = () => {
  const {authenticated, logout} = useContext(AuthContext);
  const [showLogin, setShowLogin] = useState(true);
  const [showHistory, setShowHistory] = useState(false);


  const handleSwitchToLogin = () => {
    setShowLogin(true);
  };

  const handleSwitchToRegister = () => {
    setShowLogin(false);
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
              <Login />
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
                <HistoryPage />
                <button className="btn btn-secondary mt-3" onClick={() => setShowHistory(false)}>Back</button>
              </>
            ) : (
              // Show Alerts Page
              <>
                <button onClick={() => setShowHistory(true)}>History</button>
                <button className='btn btn-secondary mt-3' onClick={logout} >Logout</button>
                <StockForm />
                <p className="warning">
                  Please be aware that this service only offers access to the American
                  stock exchanges.
                </p>
                <AlertTable />
              </>
            )}
          </>
        )}
      </div>
    );
  };
  
  export default App;