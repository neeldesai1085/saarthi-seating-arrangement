import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import roomRoutes from './routes/roomRoutes.js';
import ruleRoutes from './routes/ruleRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/rooms', roomRoutes);
app.use('/api/rules', ruleRoutes);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Exam Seating API is running' });
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
