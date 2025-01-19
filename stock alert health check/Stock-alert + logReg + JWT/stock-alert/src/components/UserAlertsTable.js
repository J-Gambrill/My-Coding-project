import React, {useEffect, useState} from "react";
import axios from "axios";
import './UserAlertsTable.css'

const UserAlertsTable = () => {
    const [alerts, setAlerts] = useState([])
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await axios.get('http://localhost:5000/user_alerts', {
                withCredentials: true
                })
                setAlerts(response.data.alerts)
            } catch (err) {
                setError('Failed to fetch alerts. Please try again later.')
            }    
        }

        fetchAlerts()
    }, [])

    if (error) {
        return <div className="error-message">{error}</div>
    }

    return (
        <div className="alerts-table-container">
            <h2>Active Alerts</h2>
            {alerts.length === 0 ? (
                <p>No alerts found. Please create an alert above.</p>
            ) : (
                <table className="alerts-table">
                    <thead>
                        <tr>
                            <th>Stock Symbol</th>
                            <th>Price</th>
                            <th>Price Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        {alerts.map((alert) => (
                            <tr key={alert.id}>
                             <td>{alert.symbol}</td>
                             <td>{alert.price}</td>
                             <td>{alert.price_type}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}

export default UserAlertsTable
    