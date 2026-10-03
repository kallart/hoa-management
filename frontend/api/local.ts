import dotenv from 'dotenv';
dotenv.config();
import app from './index.ts';

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Local API server running on http://localhost:${port}`);
});
