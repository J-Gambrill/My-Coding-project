import React, { useState } from 'react';
import './StockForm.css';
import axios from 'axios'; // axios is much simpler than fetch and so i have devcided to use this for my project.

const StockForm = () => {
    const [symbol, setSymbol] = useState('');
    const [price, setPrice] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState(''); //without this the error message will not work

    const handleSubmit = async (e) => {
        e.preventDefault();
         
        // Validation logic
        const trimmedSymbol = symbol.trim();
        if (!trimmedSymbol.match(/^[A-Za-z]+$/)) {
            setMessage('Invalid stock symbol! Only letters are allowed.');
            return;
        }

        if (price <= 0) {
            setMessage('Target price must be greater than 0.');
            return;
        }

        try {
            // Make API request
            const response = await axios.post('http://localhost:5000/set_alert', {
                symbol: trimmedSymbol, // Use trimmed symbol
                price,
                email,
            });

            // Success response
            setMessage(response.data.message || 'Alert set successfully!');
            setSymbol('');
            setPrice('');
            setEmail('');
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
                <label htmlFor="price">Target Price:</label>
                <span className="input-group-text">$</span>
                <input
                    type="number"
                    className="form-control"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                />
            </div>
            <div className='mb-3'> 
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <button type="submit" className="btn btn-primary" >Set Alert</button>
            {message && <p className="alert alert-info">{message}</p>}
        </form>
    );
};

export default StockForm;