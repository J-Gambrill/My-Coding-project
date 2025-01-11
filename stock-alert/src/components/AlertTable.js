// src/components/AlertTable.js
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';

function AlertTable() {
  const { token } = useContext(AuthContext); // Access token from context
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, [token]); // Re-fetch every time token changes

  const fetchAlerts = async () => {
    // If there's no token, handle it gracefully
    if (!token) {
      setError('No valid token - please log in first.');
      console.log('Using token:', token);
      setAlerts([]); // Clear previous alerts
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/alerts', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // If 4xx or 5xx, parse error message:
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch alerts');
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error('Server returned invalid data (not an array).');
      }

      setAlerts(data); // Set the fetched alerts to state
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
      setAlerts([]); // Reset alerts to an empty array upon error
    }
  };

  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      <h2>Alerts</h2>
      {alerts.length === 0 ? (
        <p>No alerts currently set.</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Price</th>
              <th>Price Type</th>
              <th>Email</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id}>
                <td>{alert.symbol}</td>
                <td>{alert.price}</td>
                <td>{alert.price_type}</td>
                <td>{alert.email}</td>
                <td>{alert.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AlertTable;
