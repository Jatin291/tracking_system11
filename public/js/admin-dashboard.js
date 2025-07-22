document.addEventListener('DOMContentLoaded', () => {
    const userForm = document.getElementById('userForm');
    const usersList = document.getElementById('usersList');
    const messageDiv = document.getElementById('message');

    // Add form validation
    userForm.addEventListener('input', (e) => {
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Username validation
        if (username) {
            const usernameError = document.getElementById('usernameError');
            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                if (!usernameError) {
                    const errorDiv = document.createElement('div');
                    errorDiv.id = 'usernameError';
                    errorDiv.className = 'error-message';
                    errorDiv.textContent = 'Username can only contain letters, numbers, and underscores';
                    userForm.insertBefore(errorDiv, userForm.querySelector('input[name="username"]').nextElementSibling);
                }
            } else if (usernameError) {
                usernameError.remove();
            }
        }

        // Email validation
        if (email) {
            const emailError = document.getElementById('emailError');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (!emailError) {
                    const errorDiv = document.createElement('div');
                    errorDiv.id = 'emailError';
                    errorDiv.className = 'error-message';
                    errorDiv.textContent = 'Please enter a valid email address';
                    userForm.insertBefore(errorDiv, userForm.querySelector('input[name="email"]').nextElementSibling);
                }
            } else if (emailError) {
                emailError.remove();
            }
        }

        // Password validation
        if (password) {
            const passwordError = document.getElementById('passwordError');
            if (password.length < 4) {
                if (!passwordError) {
                    const errorDiv = document.createElement('div');
                    errorDiv.id = 'passwordError';
                    errorDiv.className = 'error-message';
                    errorDiv.textContent = 'Password must be at least 4 characters long';
                    userForm.insertBefore(errorDiv, userForm.querySelector('input[name="password"]').nextElementSibling);
                }
            } else if (passwordError) {
                passwordError.remove();
            }
        }
    });

    // Load existing users
    loadUsers();

    // Handle form submission
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: document.getElementById('role').value
        };

        // Validate form data
        if (!formData.username || !formData.password) {
            showMessage('Username and password are required', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('User added successfully!', 'success');
                userForm.reset();
                loadUsers();
            } else {
                // Show detailed error message if available
                const errorMessage = data.message || data.error || 'Failed to add user';
                showMessage(errorMessage, 'error');
                console.error('Server response:', data);
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('An error occurred while adding user', 'error');
        }
    });

    // Handle logout
    logoutBtn.addEventListener('click', function() {
        try {
            // Clear local storage
            localStorage.removeItem('username');
            localStorage.removeItem('email');
            localStorage.removeItem('role');

            // Redirect to login page
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error logging out. Please try again.');
        }
    });

    // Load users from server
    async function loadUsers() {
        try {
            const response = await fetch('http://localhost:3001/api/admin/users');
            const data = await response.json();
            
            if (response.ok) {
                displayUsers(data.users);
            } else {
                showMessage('Error loading users', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Error loading users', 'error');
        }
    }

    // Display users in the list
    function displayUsers(users) {
        usersList.innerHTML = users.map(user => `
            <div class="user-item">
                <strong>${user.username}</strong>
                <span class="email">${user.email}</span>
                <span class="role-badge ${user.role}">${user.role}</span>
            </div>
        `).join('');
    }

    // Show message
    function showMessage(message, type) {
        messageDiv.innerHTML = `
            <div class="${type}-message">${message}</div>
        `;
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
    }
});
