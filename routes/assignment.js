const router = require("express").Router();
const {
  createAssignment,
  deleteAssignment,
  updateAssignment,
  submitAssignment,
  retrieve,
  retrieveFeed,
} = require("../controllers/assignment/index");
const { restrictTo } = require("../controllers/auth/index");
const { auth } = require("../middleware/auth");

//use auth as middleware to carefull handle resource sharing
router.use(auth);

router.post("/create", restrictTo("tutor"), createAssignment);

router.delete("/delete/:id", restrictTo("tutor"), deleteAssignment);

router.put("/update/:id", restrictTo("tutor"), updateAssignment);

router.post("/submit", restrictTo("student"), submitAssignment);

router.post("/retrieve/:id", restrictTo("student", "tutor"), retrieve);

router.get("/retrieve-feed", restrictTo("student", "tutor"), retrieveFeed);

module.exports = router;
