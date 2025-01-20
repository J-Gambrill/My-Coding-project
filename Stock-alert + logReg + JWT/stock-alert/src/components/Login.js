import React, { useState } from 'react'
import './Login.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { login } from '../Auth.js'

function Login({setAuthenticated}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        await login(username, password);
        setAuthenticated(true)
        setError(null)
    } catch (err) {
        setError('Invalid username or password. Please try again.')
        setAuthenticated(false)
    }
  };

    return (
        <div className="container mt-4">
            <h2 className='Login-H'>Login</h2>
            {error && <p style={{ color: 'red'}}>{error}</p>}
            <form onSubmit={handleSubmit}>
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