document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const adminToggle = document.getElementById('adminToggle');
    const roleDisplay = document.getElementById('roleDisplay');

    // Handle admin toggle
    adminToggle.addEventListener('change', () => {
        const isAdmin = adminToggle.checked;
        roleDisplay.textContent = isAdmin ? 'Admin Mode' : 'User Mode';
        roleDisplay.className = `role-display ${isAdmin ? 'admin' : 'user'}`;
        roleDisplay.style.display = 'block';
    });

    // Handle login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const isAdmin = adminToggle.checked;

        try {
            const response = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok) {
                // Store user info in localStorage
                localStorage.setItem('username', username);
                localStorage.setItem('email', data.email);
                localStorage.setItem('role', data.role);
                localStorage.setItem('token', data.token); // Store the actual token from server

                if (data.role === 'admin') {
                    window.location.href = '/admin-dashboard';
                } else {
                    window.location.href = '/user-dashboard';
                }
            } else {
                console.error('Login error:', data);
                alert(data.message || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during login');
        }
    });

});
