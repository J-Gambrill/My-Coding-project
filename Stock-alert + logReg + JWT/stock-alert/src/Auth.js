// Assume we have a function to call our Flask backend
async function login(username, password) {
    try {
      const response = await fetch('http://localhost:5000/Login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include' // this ensures cookies are sent and retrieved
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Invalid username or password');
      }
  
      console.log('Logged in successfully!');
      return data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error; 
    }
  }
  async function getProtectedData() {
    try {
      const response = await fetch('http://localhost:5000/protected', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Protected data:', data);
      } else {
        if (data.error === 'Token expired') {
          // Attempt to refresh the token
          const refreshResponse = await fetch('http://localhost:5000/refresh', {
            method: 'POST',
            credentials: 'include'
          });
          const refreshData = await refreshResponse.json();
          if (refreshResponse.ok) {
            // Store new access token and retry
            localStorage.setItem('accessToken', refreshData.access_token);
            return getProtectedData(); // retry
          } else {
            console.error('Refresh token failed', refreshData.error);
          }
        } else {
          console.error(data.error);
        }
      }
    } catch (error) {
      console.error('Error accessing protected route:', error);
    }
  }
// exports the functions
export { login, getProtectedData }