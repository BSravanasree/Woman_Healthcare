const express = require('express');
const router = express.Router();
const Woman = require('../models/Woman'); // import the model

// ✅ Test route
router.get('/', (req, res) => {
    res.json({ success: true, message: 'Woman route is working properly' });
});

// ✅ Create new woman record
router.post('/', async (req, res) => {
    try {
        const newWoman = new Woman(req.body);
        await newWoman.save();
        res.status(201).json(newWoman);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;

