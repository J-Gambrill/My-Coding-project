//I am using AuthContext to import the token from login.This allows data to be shared across components 
// without having to pass it explicitly through props at every level. It alsomost acts as a store for the whole app to just draw it from.


import React, { useState } from 'react'
import './Login.css';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthContext } from '../AuthContext';

const Login = ({setAuthenticated}) => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)

    const onLoginSuccess = (token) => {
        localStorage.setItem('access_token', token);
        setAuthenticated(true);
        console.log('Login successful');
        console.log({token})
    };
    

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
    
        try {
            const response = await axios.post('http://localhost:5000/Login', {
                username, 
                password,
            });
    
            // Check the response status
            if (response.status !== 200) throw new Error('Login Failed');
    
            const {access_token} = response.data; // Access JSON data directly
    
            if (access_token) {
                onLoginSuccess(access_token);
            } else {
                throw new Error('No token returned');
            }
    
        } catch (err) {
            console.error(err);
            setError('Invalid credentials');
            alert('Invalid credentials');
        }
    };
    

    return (
        <div className="container mt-4">
            <h2 className='Login-H'>Login</h2>
            {error && <p style={{ color: 'red'}}>{error}</p>}
            <form onSubmit={handleLogin}>
                <div className='mb-3'>
                    <label className='form-label'>Username</label>
                    <input
                        type='text'
                        className='form-control'
                        placeholder='Enter Your Username'
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className='mb-3'>
                    <label className='form-label'>Password</label>
                    <input
                        type='password'
                        className='form-control'
                        placeholder='Enter your password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type='submit' className='btn btn-primary'>Login</button>
            </form>
        </div>
    )
}

export default Login