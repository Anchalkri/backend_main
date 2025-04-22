const notes = {}; // store notes in memory

const setupSocket = (io) => {
    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);

        // join a note room
        socket.on("join_note", (noteId) => {
            socket.join(noteId);
            if(notes[noteId]) {
                socket.emit("load_note", notes[noteId]); //send 
            } else {
                notes[noteId] = ""; //Initialize if not present
            }
        });

        // Listen for changes in the note
        socket.on("update_note", ({ noteId, content }) => {
            notes[noteId] = content;
            socket.to(noteId).emit("receive_update", content)
        });

        socket.on("disconnect", () => {
            console.log("User disconnected");
        })
    })
}

module.exports = setupSocket