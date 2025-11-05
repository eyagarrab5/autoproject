const express = require('express');
const router = express.Router();
const testController=require("../controller/testController");
const validate=require('../middl/validate')

router.get('/', (req, res) => {
    console.log('hello 4 data');
});

// Ajout d’un utilisateur via GET (mieux vaut POST mais ok pour test)
/* router.get('/add/:username/:email/:cin', (req, res) => {
    new User({
        username: req.params.username,
        email: req.params.email,
        cin: req.params.cin
    }).save();
        console.log("good added");
});*/
 
router.post("/add",validate,testController.add)
router.get("/showuser",testController.showuser);
router.get("/showuserbyid/:id",testController.showuserbyid);
router.get("/showuserbyusername/:username", testController.showuserbyusername);
 

// 2) Tous les utilisateurs ayant ce username (si doublons possibles)
router.get("/showAllusername/:username", testController.showAllusername);
// DELETE /deleteuser/:id
router.delete("/deleteuser/:id", testController.deleteuser);
// PUT /updateuser/:id
router.put("/updateuser/:id", testController.updateuser  );


module.exports = router;
