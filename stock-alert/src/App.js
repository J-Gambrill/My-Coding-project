import React from 'react';
import StockForm from './components/StockForm';

const App = () => {
    return (
        <div>
            <h1 class='header'>Stock Price Alert</h1>
            <StockForm />
            <p class='warning'>Please be aware that this service only offers acces to the American stock exchanges.</p>
        </div>
    );
};

export default App;

