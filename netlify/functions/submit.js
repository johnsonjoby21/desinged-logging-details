const { Client } = require('pg');
const bcrypt = require('bcryptjs');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
        };
    }

    // Connect to database
    // DATABASE_URL should be set in Netlify Environment Variables
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Required for Neon
        }
    });

    try {
        await client.connect();

        // Parse incoming data
        // Content-Type could be multipart/form-data or application/json. 
        // Netlify Functions don't parse multipart automatically well without libraries like busboy.
        // For simplicity in this demo, it's easiest if frontend sends JSON. 
        // However, if we must emulate the previous FormData behavior, we'll try to parse JSON first.
        // Let's assume the frontend will be updated to send JSON or we handle basic parsing.

        let params;
        try {
            params = JSON.parse(event.body);
        } catch (e) {
            // Very basic form-urlencoded parser if JSON fails (fallback)
            const queryString = require('querystring');
            params = queryString.parse(event.body);
        }

        const type = params.type;

        if (type === 'signup') {
            const { username, email, password } = params;

            if (!username || !email || !password) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ success: false, message: 'All fields are required' })
                };
            }

            // Check if user exists
            const checkQuery = 'SELECT id FROM users WHERE email = $1 OR username = $2';
            const checkRes = await client.query(checkQuery, [email, username]);

            if (checkRes.rows.length > 0) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ success: false, message: 'User already exists' })
                };
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Insert user
            const insertQuery = 'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)';
            await client.query(insertQuery, [username, email, passwordHash]);

            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'Account created successfully' })
            };

        } else if (type === 'contact') {
            const { name, email, message } = params;

            if (!name || !email || !message) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ success: false, message: 'All fields are required' })
                };
            }

            const insertQuery = 'INSERT INTO messages (name, email, message) VALUES ($1, $2, $3)';
            await client.query(insertQuery, [name, email, message]);

            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'Message sent successfully' })
            };
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, message: 'Invalid request type' })
            };
        }

    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Internal Server Error: ' + error.message })
        };
    } finally {
        await client.end();
    }
};
