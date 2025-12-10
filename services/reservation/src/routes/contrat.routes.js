const router = require("express").Router();
const controller = require("../controllers/contrat.controller");

router.post("/add", controller.create);
router.get("/all", controller.list);
router.get("/:id", controller.getById);
router.get("/numero/:numero", controller.getByNumero);
router.put("/:id", controller.update);
router.put("/:id/cancel", controller.cancel);

module.exports = router;
