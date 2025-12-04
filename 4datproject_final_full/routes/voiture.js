const router = require("express").Router();
const controller = require("../controller/voitureController");

router.post("/add", controller.create);
router.get("/all", controller.list);
router.get("/:id", controller.get);
router.delete("/:id", controller.delete);

module.exports = router;
