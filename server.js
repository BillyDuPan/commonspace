import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT ? process.env.PORT : 8080; // Modified line

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

console.log("process.env.PORT: ", process.env.PORT);
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
