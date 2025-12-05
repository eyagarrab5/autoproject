const express = require("express");
const router = express.Router();
const testcontroller = require("../controller/testController");
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
router.post("/add", validate, testcontroller.add);
router.get("/showuser", testcontroller.showuser);
router.get("/showuserbyid/:id", testcontroller.showuserbyid);
router.get("/showuserbyusername/:username", testcontroller.showuserbyusername);
router.get("/showAllusername/:username", testcontroller.showAllusername);
router.delete("/deleteuser/:id", testcontroller.deleteuser);
router.put("/updateuser/:id", testcontroller.updateuser);

router.get("/showtwig", (req, res) => {
  res.render("show");
});

module.exports = router;
