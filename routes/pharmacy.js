const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Pharmacy route placeholder' });
});

module.exports = router;