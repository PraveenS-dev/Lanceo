import Notification from "../../model/Notification";
import NotificationLog from "../../model/NotificationLog";
import { Request, Response } from "express";
import { Server } from "socket.io";

interface NotifyOptions {
    title: string;
    subject: string;
    assigned_users: string[];
    url?: string;
    io: Server;
}

const sendNotification = async (options: NotifyOptions) => {

    const { title, subject, assigned_users, url, io } = options;

    // 1. Save to DB
    const newNotification = new Notification({
        title,
        subject,
        assigned_users: assigned_users.join(","),
        url,
    });
    await newNotification.save();

    // 2. Emit via Socket.IO for each user room (safer than broadcast)
    assigned_users.forEach((userId) => {
        const roomName = `notification_${userId}`;
        // send to the specific room so only joined sockets receive it
        io.to(roomName).emit(roomName, {
            ...newNotification.toObject(),
            isRead: false,
        });
        console.log(`Sent notification to room ${roomName}`);
    });

    return newNotification;


}

const GetData = async (req: any, res: Response) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({ message: "User ID is required." });
        }

        const notifications = await Notification.find({
            assigned_users: { $regex: new RegExp(`(^|,)${user_id}(,|$)`) },
        })
            .sort({ created_at: -1 });

        const result = await Promise.all(
            notifications.map(async (notifi) => {
                const readLog = await NotificationLog.findOne({
                    notification_id: notifi._id,
                    userId: user_id,
                });

                return {
                    ...notifi.toObject(),
                    isRead: !!readLog,
                };
            })
        );

        return res.status(200).json({
            message: "Notifications fetched successfully!",
            notifications: result,
        });
    } catch (err: any) {
        console.error("Error fetching notifications:", err);
        return res.status(500).json({ message: err.message });
    }
};

const ViewNotification = async (req: any, res: Response) => {
    try {
        const { notification_id, userId } = req.body

        const NewNotificationLog = new NotificationLog({ notification_id, userId });
        await NewNotificationLog.save();

        return res.status(200).json({ message: "Notification Log Stored Successfully!" });

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}

const MarkAllRead = async (req: any, res: Response) => {
    try {
        const { userId } = req.body

        const notifications = await Notification.find({
            assigned_users: { $regex: new RegExp(`(^|,)${userId}(,|$)`) },
        })

        await Promise.all(notifications.map(async (notification) => {
            const logExist = await NotificationLog.findOne({ notification_id: notification._id, userId: userId });
            if (!logExist) {
                const NewNotificationLog = new NotificationLog({ notification_id: notification._id, userId });
                await NewNotificationLog.save();
            }
        }))

        return res.status(200).json({ message: "Notification Log Stored Successfully!" });

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}

const GetDataAll = async (req: any, res: Response) => {
    try {
        const { user_id } = req.body;
        const notifications = await Notification.find({
            assigned_users: { $regex: new RegExp(`(^|,)${user_id}(,|$)`) }
        }).sort({ created_at: -1 });

        const result = await Promise.all(
            notifications.map(async (notifi) => {
                const notificationReadStatus = await NotificationLog.findOne({
                    notification_id: notifi._id,
                    userId: user_id
                });

                return {
                    ...notifi.toObject(),
                    isRead: notificationReadStatus ? false : true
                };
            })
        );

        return res.status(200).json({
            message: "Notifications fetched successfully!",
            notifications: result
        });

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};

export { sendNotification, GetData, ViewNotification, GetDataAll, MarkAllRead }