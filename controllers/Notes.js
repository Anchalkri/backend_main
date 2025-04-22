const Notes = require("../models/Notes");
const Course = require("../models/Course");

exports.addNotesController = async (req, res) => {
    try {
        if(req.user){
            console.log("Request User:", req.user);
        }

        // Ensure the authentication middleware has set req.user
        if (!req.user || (!req.user._id && !req.user.id)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. User not found in request",
            });
        }

        const { content, courseId } = req.body;
        const userId = req.user._id || req.user.id; // Ensure correct user ID extraction

        if (!content || !courseId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        const newNote = new Notes({
            content,
            course: courseId,
            createdBy: userId,
        });

        // Save the note
        await newNote.save();

        // Add note reference to the course
        course.notes.push(newNote._id);
        await course.save();

        return res.status(201).json({
            success: true,
            message: "Note added successfully",
            note: newNote,
        });
    } catch (error) {
        console.error("Error adding note:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.getNotesController = async (req, res) => {
    try {
        console.log("Request User:", req.user);

        // Ensure authentication middleware has set req.user
        if (!req.user || (!req.user._id && !req.user.id)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. User not found in request",
            });
        }

        const userId = req.user._id || req.user.id; // Get user ID from authentication
        const { courseId } = req.query; // Optional query parameter

        let query = { createdBy: userId }; // Fetch notes created by the user

        if (courseId) {
            query.course = courseId; // Filter by course if provided
        }

        const notes = await Notes.find(query).populate("course", "title"); // Populate course title

        return res.status(200).json({
            success: true,
            message: "Notes fetched successfully",
            notes,
        });
    } catch (error) {
        console.error("Error fetching notes:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.updateNotesController = async (req, res) => {
    try {
        console.log("Request User:", req.user);

        // Ensure authentication middleware has set req.user
        if (!req.user || (!req.user._id && !req.user.id)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. User not found in request",
            });
        }

        const userId = req.user._id || req.user.id;
        const { noteId } = req.params; // Note ID from route params
        const { content } = req.body; // New content for the note

        if (!content) {
            return res.status(400).json({
                success: false,
                message: "Content is required to update the note",
            });
        }

        // Find the note by ID and ensure it belongs to the user
        const note = await Notes.findOne(noteId);
        console.log("Notes: ", note)
        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Note not found or you are not authorized to update this note",
            });
        }

        // Update the note content
        note.content = content;
        await note.save();

        return res.status(200).json({
            success: true,
            message: "Note updated successfully",
            note,
        });
    } catch (error) {
        console.error("Error updating note:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};