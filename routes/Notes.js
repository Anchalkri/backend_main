const express = require("express");
const router = express.Router();
const {
  addNotesController,
  getSingleNoteController,
  getAllNotesByUserController,
  updateNotesController,
  deleteNoteController,
  shareNoteController,
  getPublicNotesController,
  requestAccessController,
  approveAccessRequestController
} = require("../controllers/Notes");

const { auth, isStudent } = require("../middleware/auth");

// 📌 Create a new note
router.post("/", auth, isStudent, addNotesController); //tested

// 📌 Get all notes created by the logged-in user
router.get("/my-notes", auth, getAllNotesByUserController); //tested

// 📌 Get a single note by ID
router.get("/:noteId", auth, getSingleNoteController); //tested

// 📌 Update a note
router.put("/:noteId", auth, updateNotesController); //tested

// 📌 Delete a note
router.delete("/:noteId", auth, deleteNoteController); //tested

// 📌 Share a note with another user
router.post("/:noteId/share", auth, shareNoteController); //tested

// 📌 Get all public notes (for discovery/explore)
router.get("/", getPublicNotesController); //tested

// 📌 Request access to a private note
router.post("/:noteId/request-access", auth, requestAccessController); //tested

// 📌 Approve a collaborator’s request
router.post("/:noteId/approve-access", auth, approveAccessRequestController); //tested

module.exports = router;