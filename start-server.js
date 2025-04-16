import path from 'path';
import { fileURLToPath } from 'url';

const port = process.env.PORT || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import('serve').then((serve) => {
  serve.default(path.join(__dirname, 'dist'), { port }).then((server) => {
  console.log(`Server listening on port ${port}`);
});
});