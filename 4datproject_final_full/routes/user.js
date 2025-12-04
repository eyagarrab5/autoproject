const router = require("express").Router();
const controller = require("../controller/userController");

router.post("/add", controller.create);
router.get("/all", controller.list);

module.exports = router;
