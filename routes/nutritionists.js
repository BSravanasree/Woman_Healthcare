const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'nutritionsists route placeholder' });
});

module.exports = router;