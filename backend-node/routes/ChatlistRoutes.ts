import express from "express";
import ChatList from "../model/chats/ChatList";
import User from "../model/User";

const router = express.Router();

router.post("/start", async (req, res) => {
  try {
    const { userId, contactId } = req.body;

    if (!userId || !contactId) {
      return res.status(400).json({ success: false, message: "Missing userId or contactId" });
    }

    // Check if chat already exists for this user with the contact
    let chat = await ChatList.findOne({ userId, contactId });

    // Create if not exists
    if (!chat) {
      chat = await ChatList.create({
        userId,
        contactId,
        lastMessage: "",
        lastMessageTime: new Date(),
        unreadCount: 0,
      });
    }

    const contact = await User.findById(contactId).select("name");

    return res.status(200).json({
      success: true,
      chatId: chat._id,
      contactId,
      contactName: contact?.name || "User",
    });
  } catch (err) {
    console.error("Error creating chat:", err);
    return res.status(500).json({ success: false, message: err });
  }
});

// Get chats for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

    const chats = await ChatList.find({ userId }).sort({ lastMessageTime: -1 }).lean();
    // populate contact name
    const results = await Promise.all(
      chats.map(async (c: any) => {
        const contact = await User.findById(c.contactId).select("name");
        return {
          contactId: c.contactId,
          contactName: contact?.name || "User",
          lastMessage: c.lastMessage,
          lastMessageTime: c.lastMessageTime,
          unreadCount: c.unreadCount || 0,
        };
      })
    );

    return res.status(200).json({ success: true, chats: results });
  } catch (err) {
    console.error("Error fetching chatlist:", err);
    return res.status(500).json({ success: false, message: err });
  }
});

// Mark chat unread count as read (set unreadCount = 0)
router.post("/mark-read", async (req, res) => {
  try {
    const { userId, contactId } = req.body;
    if (!userId || !contactId) return res.status(400).json({ success: false, message: "Missing userId or contactId" });

    await ChatList.findOneAndUpdate({ userId, contactId }, { unreadCount: 0 });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error marking chat as read:", err);
    return res.status(500).json({ success: false, message: err });
  }
});

export default router;
