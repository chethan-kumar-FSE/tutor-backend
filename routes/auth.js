const router = require("express").Router();
const { signup, signin } = require("../controllers/auth/index");

router.post("/signup", signup);
router.get("/signin", signin);

module.exports = router;
