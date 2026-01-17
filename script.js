function switchTab(tab) {
    const signupForm = document.getElementById('signupForm');
    const contactForm = document.getElementById('contactForm');
    const tabs = document.querySelectorAll('.tab-btn');

    if (tab === 'signup') {
        signupForm.classList.remove('hidden');
        contactForm.classList.add('hidden');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        signupForm.classList.add('hidden');
        contactForm.classList.remove('hidden');
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
}

function showNotification(message, type = 'success') {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.className = type === 'success' ? '' : 'error';
    notif.classList.add('show');

    setTimeout(() => {
        notif.classList.remove('show');
    }, 3000);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function handleSignup(event) {
    event.preventDefault();

    // Reset errors
    document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    let isValid = true;

    if (username.length < 3) {
        document.getElementById('usernameError').textContent = 'Username must be at least 3 chars';
        isValid = false;
    }

    if (!validateEmail(email)) {
        document.getElementById('emailError').textContent = 'Invalid email address';
        isValid = false;
    }

    if (password.length < 6) {
        document.getElementById('passwordError').textContent = 'Password must be at least 6 chars';
        isValid = false;
    }

    if (!isValid) return;

    // Send to Netlify Function
    try {
        const payload = {
            type: 'signup',
            username: username,
            email: email,
            password: password
        };

        const response = await fetch('/.netlify/functions/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Account created successfully!');
            document.getElementById('signupForm').reset();
        } else {
            showNotification(data.message || 'Error creating account', 'error');
        }
    } catch (e) {
        console.error(e);
        showNotification('Error connecting to server', 'error');
    }
}

async function handleContact(event) {
    event.preventDefault();

    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('message').value;

    if (!name || !validateEmail(email) || !message) {
        showNotification('Please fill all fields correctly', 'error');
        return;
    }

    try {
        const payload = {
            type: 'contact',
            name: name,
            email: email,
            message: message
        };

        const response = await fetch('/.netlify/functions/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Message sent!');
            document.getElementById('contactForm').reset();
        } else {
            showNotification('Error sending message', 'error');
        }
    } catch (e) {
        console.error(e);
        showNotification('Error connecting to server', 'error');
    }
}
