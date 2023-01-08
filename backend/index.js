const express = require('express');
const app = express();
const userRoute = require('./api/routes/User');

const port = 4000;

app.use('/api', userRoute);

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
