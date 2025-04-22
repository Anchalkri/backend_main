const express = require("express")
const router = express.Router()
const { addNotesController, getNotesController, updateNotesController } = require("../controllers/Notes")
const { isStudent, auth } = require("../middleware/auth")

router.post("/addNote", auth, isStudent, addNotesController)
router.get("/getNote", auth, getNotesController)
router.put("/updateNote", auth, updateNotesController)

module.exports = router
