// src/server.ts
import app from './app';
import dotenv from 'dotenv';

// Load environment variables (if not already loaded by app.ts, though it should be)
dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
