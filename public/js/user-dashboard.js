document.addEventListener('DOMContentLoaded', () => {
    // Navigation and page management
    const leaveForm = document.getElementById('leaveForm');
    const leaveHistoryBody = document.getElementById('leaveHistoryBody');
    const leaveRequestPage = document.getElementById('leaveRequestPage');
    const leaveHistoryContainer = document.getElementById('leaveHistoryContainer');
    const attendanceHistoryContainer = document.getElementById('attendanceHistoryContainer');
    const leaveRequestBtn = document.getElementById('leaveRequestBtn');
    const leaveHistoryBtn = document.getElementById('leaveHistoryBtn');
    const backBtns = document.querySelectorAll('.back-btn');
    const usernameDisplay = document.getElementById('username');
    const currentDateDisplay = document.getElementById('currentDate');
    const currentTimeDisplay = document.getElementById('currentTime');
    const timerDisplay = document.getElementById('timerDisplay');
    const clockInBtn = document.getElementById('clockInBtn');
    const clockOutBtn = document.getElementById('clockOutBtn');
    const messageDiv = document.getElementById('message');
    const logoutBtn = document.getElementById('logoutBtn');
    const attendanceHistoryBtn = document.getElementById('attendanceHistoryBtn');
    const attendanceBody = document.getElementById('attendanceBody');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const minHoursInput = document.getElementById('minHours');
    const tableHeaders = document.querySelectorAll('#attendanceTable th');
    let leaveRecords = [];
    let attendanceRecords = [];
    let currentSort = 'date';
    let sortDirection = 'desc';
    let startTime;
    let timerInterval;
    let isClockingIn = false;

    // Hide all page content initially
    function hideAllPages() {
        leaveRequestPage.style.display = 'none';
        leaveHistoryContainer.style.display = 'none';
        attendanceHistoryContainer.style.display = 'none';
    }

    // Initialize leave history
    async function initializeLeaveHistory() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No token found. Please log in again.');
            }

            const response = await fetch('/api/leave/history', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                // Token is invalid or expired
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                window.location.href = '/';
                return;
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch leave history');
            }

            // Log the raw data from server
            console.log('Raw leave data from server:', data);
            
            // Use the raw IDs as they come from the server
            leaveRecords = [...data];
            
            console.log('Processed leave records:', leaveRecords);
            updateLeaveHistoryTable();
        } catch (error) {
            console.error('Error fetching leave history:', error);
            messageDiv.classList.remove('success-message');
            messageDiv.classList.add('error-message');
            messageDiv.textContent = error.message;
        }
    }

    // Update leave history table
    function updateLeaveHistoryTable() {
        leaveHistoryBody.innerHTML = '';
        leaveRecords.forEach(leave => {
            const row = document.createElement('tr');
            const deleteButton = leave.status === 'pending' ? `
                <td>
                    <button class="delete-leave-btn" data-id="${leave._id}">Delete</button>
                </td>
            ` : '';
            row.innerHTML = `
                <td>${leave.leaveType}</td>
                <td>${new Date(leave.startDate).toLocaleDateString()}</td>
                <td>${new Date(leave.endDate).toLocaleDateString()}</td>
                <td class="${leave.status.toLowerCase()}">${leave.status}</td>
                ${deleteButton}
            `;
            leaveHistoryBody.appendChild(row);
        });

        // Add click handlers for delete buttons
        document.querySelectorAll('.delete-leave-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                event.preventDefault();
                const leaveId = button.dataset.id;
                
                try {
                    const response = await fetch(`/api/leave/${leaveId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    if (!response.ok) {
                        const errorText = response.statusText || 'Failed to delete leave request';
                        throw new Error(errorText);
                    }

                    // Remove the deleted leave from records
                    leaveRecords = leaveRecords.filter(leave => leave._id !== leaveId);
                    updateLeaveHistoryTable();
                    showMessage('Leave request deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting leave:', error);
                    showMessage(error.message, 'error');
                }
            });
        });
    }

    // Page navigation handlers
    leaveRequestBtn.addEventListener('click', () => {
        hideAllPages();
        leaveRequestPage.style.display = 'block';
    });

    leaveHistoryBtn.addEventListener('click', async () => {
        hideAllPages();
        await initializeLeaveHistory();
        leaveHistoryContainer.style.display = 'block';
    });

    attendanceHistoryBtn.addEventListener('click', () => {
        hideAllPages();
        attendanceHistoryContainer.style.display = 'block';
    });

    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            hideAllPages();
        });
    });

    // Handle leave form submission
    leaveForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const leaveData = {
            leaveType: document.getElementById('leaveType').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            reason: document.getElementById('reason').value,
            status: 'pending'
        };

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        fetch('/api/leave/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(leaveData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                messageDiv.classList.remove('error-message');
                messageDiv.classList.add('success-message');
                messageDiv.textContent = 'Leave request submitted successfully!';
                leaveForm.reset();
                hideAllPages();
                initializeLeaveHistory();
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            messageDiv.classList.remove('success-message');
            messageDiv.classList.add('error-message');
            messageDiv.textContent = error.message || 'Error submitting leave request';
        });
    });

    // Display current user
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = '/';
        return;
    }
    usernameDisplay.textContent = username;

    // Helper function to format hours
    function formatHours(hours) {
        const h = Math.floor(hours);
        const m = Math.floor((hours - h) * 60);
        const s = Math.floor(((hours - h) * 60 - m) * 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // Update time every second
    function updateTime() {
        const now = new Date();
        currentDateDisplay.textContent = now.toLocaleDateString();
        currentTimeDisplay.textContent = now.toLocaleTimeString();
    }
    updateTime();
    setInterval(updateTime, 1000);

    // Initialize attendance history table
    function initializeAttendanceHistory() {
        fetchAttendanceHistory();
    }

    // Fetch attendance history
    async function fetchAttendanceHistory() {
        try {
            const username = localStorage.getItem('username');
            if (!username) {
                throw new Error('Username not found');
            }

            const response = await fetch(`/api/attendance/history?username=${username}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            console.log('Attendance records from server:', data);
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch attendance history');
            }
            attendanceRecords = data;
            updateAttendanceTable();
        } catch (error) {
            console.error('Error fetching attendance history:', error);
            messageDiv.classList.remove('success-message');
            messageDiv.classList.add('error-message');
            messageDiv.textContent = error.message;
        }
    }

    // Update attendance table
    function updateAttendanceTable() {
        attendanceBody.innerHTML = '';
        attendanceRecords.forEach(record => {
            const row = document.createElement('tr');
            const clockInTime = record.clockInTime instanceof Date ? record.clockInTime : new Date(record.clockInTime);
            const clockOutTime = record.clockOutTime ? (record.clockOutTime instanceof Date ? record.clockOutTime : new Date(record.clockOutTime)) : null;
            
            let hoursWorked;
            if (clockOutTime) {
                hoursWorked = (clockOutTime - clockInTime) / 3600000;
                // Ensure hours worked is a positive number
                hoursWorked = Math.max(0, hoursWorked);
            } else {
                hoursWorked = 'In Progress';
            }

            row.innerHTML = `
                <td>${clockInTime.toLocaleDateString()}</td>
                <td>${record.username}</td>
                <td>${hoursWorked === 'In Progress' ? hoursWorked : formatHours(hoursWorked)}</td>
            `;
            attendanceBody.appendChild(row);
        });
    }



    // Attendance history button handlers
    if (attendanceHistoryBtn) {
        attendanceHistoryBtn.addEventListener('click', () => {
            hideAllPages();
            if (attendanceHistoryContainer) {
                attendanceHistoryContainer.style.display = 'block';
                fetchAttendanceHistory();
            }
        });
    }

    // Add click handlers for table headers
    if (tableHeaders) {
        tableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const headerText = header.textContent.toLowerCase();
                if (headerText === currentSort) {
                    sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
                } else {
                    currentSort = headerText;
                    sortDirection = 'desc';
                }
                filterAndSortAttendance();
            });
        });
    }

    // Add back button handler for all pages
    document.querySelectorAll('.back-btn').forEach(button => {
        button.addEventListener('click', () => {
            hideAllPages();
        });
    });

    // Clock in functionality
    clockInBtn.addEventListener('click', async () => {
        try {
            const username = localStorage.getItem('username');
            console.log('Attempting to clock in for user:', username);
            
            if (!username) {
                console.error('No username found in localStorage');
                showMessage('Error: Username not found', 'error');
                return;
            }

            const response = await fetch('/api/attendance/clock-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ username })
            });
            const data = await response.json();
            console.log('Clock in response:', data);
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to clock in');
            }

            if (data.message === 'Already clocked in') {
                console.log('User is already clocked in');
                const existingAttendance = data.data;
                const now = new Date();
                const hoursWorked = (now - existingAttendance.clockInTime) / 3600000;
                timerDisplay.textContent = formatHours(hoursWorked);
                isClockingIn = true;
                clockInBtn.disabled = true;
                clockOutBtn.disabled = false;
                return;
            }

            // Start timer
            startTime = new Date();
            isClockingIn = true;
            clockInBtn.disabled = true;
            clockOutBtn.disabled = false;
            timerInterval = setInterval(() => {
                const now = new Date();
                const hoursWorked = (now - startTime) / 3600000;
                timerDisplay.textContent = formatHours(hoursWorked);
                console.log('Working hours:', hoursWorked, 'formatted:', timerDisplay.textContent);
            }, 1000);

        } catch (error) {
            console.error('Error clocking in:', error);
            showMessage(error.message, 'error');
        }
    });

    // Clock out functionality
    clockOutBtn.addEventListener('click', async () => {
        try {
            if (!isClockingIn) {
                console.log('User is not clocked in');
                showMessage('You are not currently clocked in', 'warning');
                return;
            }

            const username = localStorage.getItem('username');
            console.log('Attempting to clock out for user:', username);
            
            if (!username) {
                console.error('No username found in localStorage');
                showMessage('Error: Username not found', 'error');
                return;
            }

            const response = await fetch('/api/attendance/clock-out', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ username })
            });
            const data = await response.json();
            console.log('Clock out response:', data);
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to clock out');
            }

            // Stop timer and reset display
            clearInterval(timerInterval);
            timerDisplay.textContent = '00:00:00';
            isClockingIn = false;
            clockInBtn.disabled = false;
            clockOutBtn.disabled = true;
            showMessage('Clocked out successfully!', 'success');

        } catch (error) {
            console.error('Error clocking out:', error);
            showMessage(error.message, 'error');
        }
    });

    // Add click handlers for table headers
    tableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const headerText = header.textContent.toLowerCase();
            if (headerText === currentSort) {
                sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
            } else {
                currentSort = headerText;
                sortDirection = 'desc';
            }
            updateAttendanceTable();
        });
    });

    // Update timer display
    function updateTimer() {
        const now = new Date();
        const diff = now - startTime;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        timerDisplay.textContent = 
            `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
    }

    // Add zero padding to numbers
    function padZero(num) {
        return num.toString().padStart(2, '0');
    }

    // Show message helper
    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `${type}-message`;
        setTimeout(() => {
            messageDiv.textContent = '';
        }, 3000);
    }

    // Filter and sort attendance records
    function filterAndSortAttendance() {
        // Get filter values
        const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
        const endDate = endDateInput.value ? new Date(endDateInput.value) : null;
        const minHours = parseFloat(minHoursInput.value) || 0;

        // Filter records
        let filteredRecords = attendanceRecords.filter(record => {
            const recordDate = new Date(record.clockInTime);
            const hours = record.workingHours?.hours || 0;
            const minutes = record.workingHours?.minutes || 0;
            const totalMinutes = hours * 60 + minutes;

            // Check date range
            const dateValid = (!startDate || recordDate >= startDate) && 
                             (!endDate || recordDate <= endDate);

            // Check minimum hours
            const hoursValid = totalMinutes >= (minHours * 60);

            return dateValid && hoursValid;
        });

        // Sort filtered records
        filteredRecords.sort((a, b) => {
            const dateA = new Date(a.clockInTime);
            const dateB = new Date(b.clockInTime);
            
            switch (currentSort) {
                case 'date':
                    return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
                case 'username':
                    return sortDirection === 'desc' ? 
                        b.username.localeCompare(a.username) : 
                        a.username.localeCompare(b.username);
                case 'working hours':
                    const hoursA = a.workingHours?.hours || 0;
                    const hoursB = b.workingHours?.hours || 0;
                    const minutesA = a.workingHours?.minutes || 0;
                    const minutesB = b.workingHours?.minutes || 0;
                    const totalMinutesA = hoursA * 60 + minutesA;
                    const totalMinutesB = hoursB * 60 + minutesB;
                    return sortDirection === 'desc' ? totalMinutesB - totalMinutesA : totalMinutesA - totalMinutesB;
            }
        });

        // Update sort indicators
        tableHeaders.forEach(header => {
            const indicator = header.querySelector('.sort-indicator');
            if (header.textContent.toLowerCase() === currentSort) {
                indicator.classList.remove('asc', 'desc');
                indicator.classList.add(sortDirection);
            } else {
                indicator.classList.remove('asc', 'desc');
            }
        });

        displayAttendanceHistory(filteredRecords);
    }

    // Display attendance history
    function displayAttendanceHistory(records) {
        if (records.length === 0) {
            attendanceBody.innerHTML = `
                <tr>
                    <td colspan="3" class="no-records">
                        <p>No attendance records found.</p>
                        <p>Start tracking your attendance by clocking in!</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Clear existing rows
        attendanceBody.innerHTML = '';

        // Add table rows
        records.forEach(record => {
            const date = new Date(record.clockInTime).toLocaleDateString();
            const workingHours = record.workingHours ? 
                `${record.workingHours.hours}h ${record.workingHours.minutes}m ${record.workingHours.seconds}s` : 
                '0h 0m 0s';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${date}</td>
                <td>${record.username}</td>
                <td class="hours-cell">${workingHours}</td>
            `;
            attendanceBody.appendChild(row);
        });
    }

    // Logout functionality
    logoutBtn.addEventListener('click', () => {
        try {
            // Clear all local storage
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            
            // Hide all pages
            hideAllPages();
            
            // Clear any active intervals
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            
            // Reset UI elements
            timerDisplay.textContent = '00:00:00';
            clockInBtn.disabled = false;
            clockOutBtn.disabled = true;
            isClockingIn = false;
            
            // Redirect to login page
            window.location.href = '/';
        } catch (error) {
            console.error('Error during logout:', error);
            showMessage('An error occurred during logout', 'error');
        }
    });
});
