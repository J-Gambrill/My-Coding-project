import React, { useEffect, useState } from 'react'

const HistoryPage = ({ token }) => {
  const [history, setHistory] = useState([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('desc')

  useEffect(() => {
    fetchHistory();
  }, [search, sort]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/history?search=${search}&sort=${sort}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await res.json()
      setHistory(data)
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  };

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
      <table>
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
    </div>
  );
};

export default HistoryPage;
