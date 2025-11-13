const express = require("express");
const router = express.Router();
const voiturecontroller = require("../controller/voitureController");
const validate = require("../middl/validate");

router.get("/test", (req, res) => {
  console.log("helo 4 data");
});

/*router.get("/add/:username/:email/:cin", (req, res) => {
  new User({
    username: req.params.username,
    email: req.params.email,
    cin: req.params.cin,
  }).save();
  console.log("good added");
});*/
router.post("/add", voiturecontroller.add);
router.get("/showvoiture", voiturecontroller.showuser);
router.get("/showvoiturebyid/:id", voiturecontroller.showuserbyid);
router.get("/showAllvoiturename/:mat", voiturecontroller.showuserbymat);
router.delete("/deletevoiture/:id", voiturecontroller.deleteuser);
router.put("/updatevoiture/:id", voiturecontroller.updateuser);

module.exports = router;
