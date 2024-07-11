
import dotenv from 'dotenv';
import connectDB from './db/index.js'; // Ensure this connects to MongoDB correctly
import {app} from './app.js'

// Load environment variables from .env file
dotenv.config({
  path: './env'
});

const port =  3000; // Use environment variable for port or default to 3000



// Connect to MongoDB and start the server
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
    process.exit(1); // Exit with failure
  });
