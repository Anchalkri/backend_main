const Note = require("../models/Notes");
const User = require("../models/User")
const { getUserAccessLevel } = require("../utils/access");
const sendEmail = require("../utils/mailSender")

const BASE_URL = process.env.base_url
// 📌 Create a new note
exports.addNotesController = async (req, res) => {
    try {
      const { title, content = "", courseId, isPublic = false } = req.body;
  
      if (!title || !courseId) {
        return res.status(400).json({ error: "Title and courseId are required." });
      }
  
      const note = await Note.create({
        title,
        content,
        courseId,
        createdBy: req.user.id,
        isPublic,
        collaborators: [], // initialize empty collaborators
      });
  
      res.status(201).json({ message: "Note created successfully", note });
    } catch (err) {
      console.error("Error in addNotesController:", err);
      res.status(500).json({ error: "Failed to create note" });
    }
  };
  

// 📌 Get all notes created by the user
exports.getAllNotesByUserController = async (req, res) => {
  try {
    const notes = await Note.find({ createdBy: req.user.id });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
};

// 📌 Get a single note by ID (with access check)
exports.getSingleNoteController = async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    if (!note) return res.status(404).json({ error: "Note not found" });

    const accessLevel = getUserAccessLevel(note, req.user.id);
    if (!accessLevel && !note.isPublic) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(note);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch note" });
  }
};

// 📌 Update a note (owner or editor only)
exports.updateNotesController = async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    if (!note) return res.status(404).json({ error: "Note not found" });

    const accessLevel = getUserAccessLevel(note, req.user.id);
    if (accessLevel !== "owner" && accessLevel !== "editor") {
      return res.status(403).json({ error: "You do not have permission to edit this note" });
    }

    note.title = req.body.title || note.title;
    note.content = req.body.content || note.content;
    note.isPublic = req.body.isPublic ?? note.isPublic;

    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: "Failed to update note" });
  }
};

// 📌 Delete a note (owner only)
exports.deleteNoteController = async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    if (!note) return res.status(404).json({ error: "Note not found" });

    const accessLevel = getUserAccessLevel(note, req.user.id);
    if (accessLevel !== "owner") {
      return res.status(403).json({ error: "Only the owner can delete this note" });
    }

    await note.deleteOne();
    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete note" });
  }
};

// 📌 Share a note with another user (owner only)
exports.shareNoteController = async (req, res) => {
  try {
    const { userId, role = "viewer" } = req.body;
    const note = await Note.findById(req.params.noteId);
    if (!note) return res.status(404).json({ error: "Note not found" });

    const accessLevel = getUserAccessLevel(note, req.user.id);
    if (accessLevel !== "owner") {
      return res.status(403).json({ error: "Only the owner can share the note" });
    }

    const existing = note.collaborators.find(
      (c) => c.userId.toString() === userId
    );

    if (existing) {
      existing.role = role;
      existing.approvedAt = new Date();
    } else {
      note.collaborators.push({ userId, role, approvedAt: new Date() });
    }

    await note.save();
    res.json({ message: "Note shared successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
};

// 📌 Get all public notes
exports.getPublicNotesController = async (req, res) => {
  try {
    const notes = await Note.find({ isPublic: true });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch public notes" });
  }
};

  
  // 📌 Request access to a private note
  exports.requestAccessController = async (req, res) => {
    const { noteId } = req.params;

    console.log("Inside requestAccessController, req.user:", req.user, "this is request.user");

    const userId = req.user.id;
    if (!userId) {
        return res.status(400).json({ message: "User not authenticated" });
    }

    const note = await Note.findById(noteId).populate("createdBy", "email name");
    console.log("Created By field inside Note:", note.createdBy);


    if (!note) return res.status(404).json({ message: "Note not found" });
  
    // Check if already requested
    const existing = note.collaborators.find(c => c.userId.equals(userId));
    if (existing) return res.status(400).json({ message: "Already requested or added" });
  
    note.collaborators.push({ userId, role: "request_pending" });
    await note.save();
  
    const requester = await User.findById(userId);
    console.log("requester: ", requester)
    console.log("note.createdBy.email: ", note.createdBy.email)
    console.log("from: ",process.env.MAIL_USER);
    const approveLink = `${BASE_URL}/notes/${noteId}/approve-access`; // or any route you handle approval from
  

    await sendEmail(
      note.createdBy.email,
      `Access Request for "${note.title}"`,
      `
        <p><strong>${requester.firstName} ${requester.lastName}</strong> requested access to your note: <strong>${note.title}</strong>.</p>
        <p><a href="${approveLink}" style="padding: 10px 20px; background: #007BFF; color: #fff; text-decoration: none; border-radius: 5px;">Approve Request</a></p>
      `
    );
  
    res.status(200).json({ message: "Access requested and email sent to owner" });
  };
  
  // 📌 Approve collaborator’s access request (owner only)
  exports.approveAccessRequestController = async (req, res) => {
    try {
      const { userId, role = "viewer" } = req.body;
      const note = await Note.findById(req.params.noteId);
      if (!note) return res.status(404).json({ error: "Note not found" });
  
      const accessLevel = getUserAccessLevel(note, req.user.id);
      if (accessLevel !== "owner") {
        return res.status(403).json({ error: "Only the owner can approve access" });
      }
  
      const collaborator = note.collaborators.find(
        (c) => c.userId.toString() === userId && c.role === "request_pending"
      );
  
      if (!collaborator) {
        return res.status(400).json({ error: "No pending request found for user" });
      }
  
      collaborator.role = role;
      collaborator.approvedAt = new Date();
  
      await note.save();
      res.json({ message: "Access approved" });
    } catch (err) {
      res.status(500).json({ error: "Failed to approve access" });
    }
  };