// routes/MessageRoutes.js
import express from "express";
import Messages from "../model/chats/Messages";
const router = express.Router();

// Get chat between 2 users
router.get("/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  const messages = await Messages.find({
    $or: [
      { senderId: user1, receiverId: user2 },
      { senderId: user2, receiverId: user1 },
    ],
  }).sort({ createdAt: 1 });
  res.json(messages);
});

export default router;
