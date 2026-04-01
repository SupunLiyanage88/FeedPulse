import 'dotenv/config';
import connectDB from './config/database';
import app from './app';

const PORT = process.env.PORT || 4000;

// Connect to MongoDB (only for the real server process)
connectDB();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});