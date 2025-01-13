import React, { useState } from 'react';
import './StockForm.css';
import axios from 'axios'; // axios is much simpler than fetch and so i have devcided to use this for my project.

const StockForm = () => {
    const [symbol, setSymbol] = useState('');
    const [highPrice, setHighPrice] = useState('');
    const [lowPrice, setLowPrice] = useState('');
    const [message, setMessage] = useState(''); //without this the error message will not work

    const handleSubmit = async (e) => {
        e.preventDefault();
         
        // Validation logic
        const trimmedSymbol = symbol.trim();
        if (!trimmedSymbol.match(/^[A-Za-z]+$/)) {
            setMessage('Invalid stock symbol! Only letters are allowed.');
            return;
        }

        if (!highPrice && !lowPrice) {
            setMessage('Please provide at least one price alert (high or low).');
            return;
        }

        // Checks if highPrice is provided and validates it
        if (highPrice && (isNaN(highPrice) || parseFloat(highPrice) <= 0)) {
            setMessage('High target price must be a number greater than 0.');
            return;
        }

        // Checks if lowPrice is provided and validates it
        if (lowPrice && (isNaN(lowPrice) || parseFloat(lowPrice) < 0)) {
            setMessage('Low target price must be a number greater than or equal to 0.');
            return;
        }

        try {
            // Make API request
            const response = await axios.post('http://localhost:5000/set_alert', {
                symbol: trimmedSymbol, // Use trimmed symbol
                high_price: highPrice || null,
                low_price: lowPrice || null,
            });

            // Success response
            setMessage(response.data.message || 'Alert set successfully!');
            setSymbol('');
            setHighPrice('');
            setLowPrice('');
        } catch (error) {
            // Handle error response
            console.error('Error:', error);
            setMessage(error.response?.data?.message || 'An error occurred. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className='form'>
            <div className='mb-3'>
                <label htmlFor="symbol" className="form-label">Stock Symbol:</label>
                <input
                    type="text"
                    className='form-control'
                    id="symbol"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    required
                />
                <div id="symbolHelp" className="form-text">
                    e.g. AAPL for Apple Inc 
                </div>
            </div>
           
            <div className='mb-3'>
                <label htmlFor="highPrice">High Target Price:</label>
                <span className="input-group-text">$</span>
                <input
                    type="number"
                    className="form-control"
                    id="highPrice"
                    value={highPrice}
                    onChange={(e) => setHighPrice(e.target.value)}
                    
                />
            </div>

 
            <div className='mb-3'>
                <label htmlFor="highPrice">Low Target Price:</label>
                <span className="input-group-text">$</span>
                <input
                    type="number"
                    className="form-control"
                    id="lowPrice"
                    value={lowPrice}
                    onChange={(e) => setLowPrice(e.target.value)}
                    
                />
            </div>

            <button type="submit" className="btn btn-primary" >Set Alert</button>
            {message && <p className="alert alert-info">{message}</p>}
        </form>
        
    );
};

export default StockForm;