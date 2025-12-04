const router = require("express").Router();
const controller = require("../controller/reservationController");

router.post("/add", controller.create);
router.get("/all", controller.list);
router.get("/:id", controller.getById);
router.get("/user/:userId", controller.listByUser);
router.get("/voiture/:voitureId", controller.listByVoiture);
router.put("/update/:id", controller.update);
router.put("/cancel/:id", controller.cancel);
router.post("/availability", controller.availability);

module.exports = router;
