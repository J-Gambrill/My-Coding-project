import React, {useEffect, useState} from "react";
import { IoRefreshOutline, IoTrashOutline } from "react-icons/io5";
import axios from "axios";
import './UserAlertsTable.css'

const UserAlertsTable = () => {
    const [alerts, setAlerts] = useState([])
    const [error, setError] = useState(null)

    // searching/filtering
    const [searchTerm, setSearchTerm] = useState("")
    const [filterOption, setFilterOption] = useState("")

    // deleting
    const [selectedAlerts, setSelectedAlerts] = useState(new Set())

    //inline editing
    const [editingAlert, setEditingAlert] = useState({})

    useEffect(() => {
        fetchAlerts();
        // Interval for auto-refresh
        const interval = setInterval(() => {
          fetchAlerts();
        }, 60000); // 60000 = minute
      
        return () => clearInterval(interval); 
      }, []);
        
    const fetchAlerts = async () => {
        try {
            const response = await axios.get('http://localhost:5000/user_alerts', {
            withCredentials: true
            })
            setAlerts(response.data.alerts)
            setError(null)
        } catch (err) {
            setError('Failed to fetch alerts. Please try again later.')
        }    
    }
    

    const handleCheckboxChange = (alertId) => {
        setSelectedAlerts((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(alertId)) {
                newSet.delete(alertId)
            } else {
                newSet.add(alertId)
            }
            return newSet
        })
    }

    const handleDeleteSelected = async() => {
        if (selectedAlerts.size === 0) return
        try {
            await axios.post(
                "http://localhost:5000/delete_user_alerts",
                { alert_ids: Array.from(selectedAlerts) },
                { withCredentials: true}
            )
            setSelectedAlerts(new Set())
            fetchAlerts()
        } catch (err) {
            console.error(err)
        }
    }

    const sortAlerts = (data) => {
        let sorted = [...data]
        switch (filterOption) {
            case "A-Z":
                sorted.sort((a, b) => a.symbol.localeCompare(b.symbol))
                break
            case "Z-A":
                sorted.sort((a, b) => b.symbol.localeCompare(a.symbol))
                break
            case "price asc":
                sorted.sort((a, b) => a.price - b.price)
                break
            case "price desc":
                sorted.sort((a, b) => b.price - a.price)
                break
            case "price type high":
                sorted = sorted.filter((alert) => alert.price_type === "high")
                break
            case "price type low":
                sorted = sorted.filter((alert) => alert.price_type === "low")
                break
            default: // no filter
                break
        }
        return sorted
    }

    const filteredAlerts = alerts.filter((alert) => {
        const lowerSearch = searchTerm.toLowerCase()
        return (
            alert.symbol.toLowerCase().includes(lowerSearch) ||
            String(alert.price).toLowerCase().includes(lowerSearch) ||
            alert.price_type.toLowerCase().includes(lowerSearch)
        )
    })

    // combines ewarch and filter
    const finalAlerts = sortAlerts(filteredAlerts)

    // click cells to trigger editing
    const handleCellClick = (alertId, field, currentValue) => {
        setEditingAlert({id: alertId, field, value: currentValue})
    }

    const handleEditChange = (e) => {
        setEditingAlert((prev) => ({ ...prev, value: e.target.value }))
    }

    const handleEditBlur = async () => {
        await updateAlert()
    }

    const handleEditKeyDown = async (e) => {
        if (e.key === "Enter") {
            await updateAlert()
        }
    }

    const updateAlert = async () => {
        try {
            const { id, field, value } = editingAlert
            const originalAlert = alerts.find((a) => a.id === id)
            if (!originalAlert) return

            const updated = {
                id: originalAlert.id, 
                symbol: originalAlert.symbol,
                price: originalAlert.price,
                price_type: originalAlert.price_type
            }

            if (field === "symbol") updated.symbol = value
            if (field === "price") updated.price = parseFloat(value) || 0
            if (field === "price_type") updated.price_type = value
            // calls api
            await axios.put("http://localhost:5000/update_alert", updated, { withCredentials: true })
        
            //updates local state
            setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)))
        
        } catch (error) {
            console.error("Error updating alert:", error)
        } finally {
            setEditingAlert({})
        }

    }

    if (error) {
        return <div className="error-message">{error}</div>
    }

    return (
        <div className="alerts-table-container">
            <h2 classname="table-header">Active Alerts</h2>
            {alerts.length === 0 ? (
                <p>No alerts found. Please create an alert above.</p>
            ) : (
                <>
                    {/* Controls for searching, filtering, and deletion */}
                    <div className="table-controls">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <select
                            value={filterOption}
                            onChange={(e) => setFilterOption(e.target.value)}
                        >
                            <option value="">No Filter/Sort</option>
                            <option value="A-Z">A-Z (Symbol)</option>
                            <option value="Z-A">Z-A (Symbol)</option>
                            <option value="price asc">Price Asc</option>
                            <option value="price desc">Price Desc</option>
                            <option value="price type high">Price Type: High</option>
                            <option value="price type low">Price Type: Low</option>
                        </select>

                        <button className="btn-delete" onClick={handleDeleteSelected}>
                            <IoTrashOutline />
                        </button>

                        <button className="btn-refresh" onClick={fetchAlerts}>
                            <IoRefreshOutline />
                        </button>
                    </div>

                    <table  className="table table-striped">
                        <thead>
                            <tr>
                                <th>Select</th>
                                <th>Stock Symbol</th>
                                <th>Price</th>
                                <th>Price Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {finalAlerts.map((alert) => (
                                <tr key={alert.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedAlerts.has(alert.id)}
                                            onChange={() => handleCheckboxChange(alert.id)}
                                        />
                                    </td>

                                    {/* Symbol - inline edit */}
                                    <td onClick={() => handleCellClick(alert.id, "symbol", alert.symbol)}>
                                        {editingAlert.id === alert.id && editingAlert.field === "symbol" ? (
                                            <input
                                                type="text"
                                                value={editingAlert.value}
                                                onChange={handleEditChange}
                                                onBlur={handleEditBlur}
                                                onKeyDown={handleEditKeyDown}
                                                autoFocus
                                            />
                                        ) : (
                                            alert.symbol
                                        )}
                                    </td>

                                    {/* Price - inline edit */}
                                    <td onClick={() => handleCellClick(alert.id, "price", alert.price)}>
                                        {editingAlert.id === alert.id && editingAlert.field === "price" ? (
                                            <input
                                                type="number"
                                                step="any"
                                                value={editingAlert.value}
                                                onChange={handleEditChange}
                                                onBlur={handleEditBlur}
                                                onKeyDown={handleEditKeyDown}
                                                autoFocus
                                            />
                                        ) : (
                                            alert.price
                                        )}
                                    </td>

                                    {/* Price Type - inline edit */}
                                    <td onClick={() => handleCellClick(alert.id, "price_type", alert.price_type)}>
                                        {editingAlert.id === alert.id && editingAlert.field === "price_type" ? (
                                            <select
                                                value={editingAlert.value}
                                                onChange={handleEditChange}
                                                onBlur={handleEditBlur}
                                                onKeyDown={handleEditKeyDown}
                                                autoFocus
                                            >
                                                <option value="high">High</option>
                                                <option value="low">Low</option>
                                            </select>
                                        ) : (
                                            alert.price_type
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default UserAlertsTable;