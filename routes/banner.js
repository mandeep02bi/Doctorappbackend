const express = require('express');
const router = express.Router();
const controller = require("../controllers/banner");
const upload = require("../middlwere/upload");

router.get('/banner', controller.get);
router.post('/banner', upload.single('image'), controller.create);

module.exports = router;
