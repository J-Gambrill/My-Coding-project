import React, { useEffect, useState, useContext } from 'react'
import { AuthContext } from '../AuthContext';

const HistoryPage = () => {
  const { token } = useContext(AuthContext) //accesses token from context
  const [history, setHistory] = useState([])
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('desc')

  useEffect(() => {
    fetchHistory();
  }, [search, sort, token]); // token = dependancy

  const fetchHistory = async () => {
    // sets an error if theres no token !=>
    if (!token) {
      setError('No valid token - please log in first.')
      console.log('Using token: ', token)
      setHistory([]) // clears history
      return
    }
    //

    try {
      const res = await fetch(
        `http://localhost:5000/history?search=${search}&sort=${sort}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        //this attempts to parse any json errors the server sends
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || 'Failed to fetch history')
      }

      const data = await res.json()

      // makes sure the server returns an array
      if (!Array.isArray(data)) {
        throw new Error ('Server returned invalid data (not an array).')
      }

      setHistory(data)
      setError(null)
    } catch (error) {
      console.error('Error fetching history:', error)
      setError(error.message)
      setHistory([]) // fallback to empty array should an error occur
    }
  };

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>
  }

  if (!Array.isArray(history)) {
    return <div>No history data found or an error occurred.</div>;
  }

  return (
    <div>
      <h2>History</h2>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Search symbol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="desc">Sort by Date (Newest)</option>
          <option value="asc">Sort by Date (Oldest)</option>
        </select>
      </div>

      {history.length === 0 ? (
        <p>No history records found.</p>
    ) : (
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Price</th>
            <th>Type</th>
            <th>Email</th>
            <th>Removed At</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.id}>
              <td>{h.symbol}</td>
              <td>{h.price}</td>
              <td>{h.price_type}</td>
              <td>{h.email}</td>
              <td>{new Date(h.removed_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
    </div>
  );
};

export default HistoryPage;
