const express = require('express');
const router = express.Router();

// @API end point  GET /api/profile
// @desc test route
// @access public
router.get('/', (req, res) => res.send('Profile route'));

module.exports = router;
