import React, { useState } from 'react'
import './Login.css';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const Login = ({setAuthenticated}) => {
    const [username, setUsername] = useState('')
    const [password, setpassword] = useState('')
    const [error, setError] = useState(null)

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await axios.post('http://localhost:5000/Login', {
                username, 
                password,
            });

            localStorage.setItem('token', response.data.access_token)
            setAuthenticated(true)
        } catch (err) {
            setError(err.response?.data?.error || 'An error ocurred.')
        }
    }

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
                        onChange={(e) => setpassword(e.target.value)}
                        required
                    />
                </div>
                <button type='submit' className='btn btn-primary'>Login</button>
            </form>
        </div>
    )
}

export default Login