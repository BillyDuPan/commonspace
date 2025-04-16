const serve = require('serve');
const path = require('path');

const port = process.env.PORT || 8080;

serve(path.join(__dirname, 'dist'), { port }).then((server) => {
  console.log(`Server listening on port ${port}`);
});