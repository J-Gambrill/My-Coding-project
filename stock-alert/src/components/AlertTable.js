// src/components/AlertTable.js
import React, { useState, useEffect } from 'react';

function AlertTable({ token }) {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If there's no token, we skip fetch or handle it gracefully
    if (!token) {
      setError('No valid token - please log in first.');
      console.log({token})
      return;
    }

    fetch('http://127.0.0.1:5000/alerts', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, 
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          // If 4xx or 5xx, parse error message:
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch alerts');
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setAlerts(data);
        } else {
          setError('Server returned invalid data (not an array).');
        }
      })
      .catch((err) => {
        console.error('Error fetching alerts:', err);
        setError(err.message);
      });
  }, [token]);

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  // If not an array (or no data yet), we can show a fallback
  if (!Array.isArray(alerts)) {
    return <div>No alerts found or an error occurred.</div>;
  }

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
