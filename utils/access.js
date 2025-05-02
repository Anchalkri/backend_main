// utils/access.js
function getUserAccessLevel(note, userId) {
    if (note.createdBy.equals(userId)) return "owner";
    const collaborator = note.collaborators.find(
      (c) => c.userId.toString() === userId && c.role !== "request_pending"
    );
    return collaborator?.role || null;
  }
  
  module.exports = { getUserAccessLevel };