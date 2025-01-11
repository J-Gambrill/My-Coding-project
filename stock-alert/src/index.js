import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { AuthProvider } from './AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css'; // this provides preprogrammed CSS for websites

ReactDOM.render(
<AuthProvider>
<App />
</AuthProvider>, 
document.getElementById('root')
);
