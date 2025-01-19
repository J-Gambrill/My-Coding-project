// HistoryPage.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import './HistoryPage.css';

const HistoryPage = ({ navigateToMain }) => {
    const [historyAlerts, setHistoryAlerts] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const perPage = 10; // Number of alerts per page

    useEffect(() => {
        const fetchHistoryAlerts = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/alert_history?page=${currentPage}&per_page=${perPage}`, {
                    withCredentials: true
                });
                setHistoryAlerts(response.data.history_alerts);
                setTotalPages(response.data.pages || 1); // Default to 1 if pages not provided
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch alerts. Please try again later.');
                setLoading(false);
            }
        };

        fetchHistoryAlerts();
    }, [currentPage]);

    const handlePrevious = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    if (loading) {
        return (
            <div className="container mt-5">
                <button onClick={navigateToMain} className="btn btn-secondary mb-3">Back</button>
                <p>Loading history...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-5">
                <button onClick={navigateToMain} className="btn btn-secondary mb-3">Back</button>
                <div className="alert alert-danger">{error}</div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <button onClick={navigateToMain} className="btn btn-secondary mb-3">Back</button>
            <h2>Your Alert History</h2> {/* Changed Title */}
            {historyAlerts.length === 0 ? (
                <p>No historical alerts found.</p>
            ) : (
                <>
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Stock Symbol</th>
                                <th>Price</th>
                                <th>Price Type</th>
                                <th>Activated At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyAlerts.map((alert) => (
                                <tr key={alert.id}>
                                    <td>{alert.symbol}</td>
                                    <td>${alert.price.toFixed(2)}</td>
                                    <td>{alert.price_type.charAt(0).toUpperCase() + alert.price_type.slice(1)}</td>
                                    <td>{alert.activated_at}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="d-flex justify-content-between">
                        <button 
                            className="btn btn-primary" 
                            onClick={handlePrevious} 
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button 
                            className="btn btn-primary" 
                            onClick={handleNext} 
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default HistoryPage;
