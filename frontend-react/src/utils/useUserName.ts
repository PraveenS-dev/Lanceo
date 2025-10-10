import { useState, useEffect } from "react";
import { apiClient } from "../services/Auth";

export const useUserName = (userId?: string) => {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (!userId) return;

    const fetchUserName = async () => {
      try {
        const res = await apiClient.get("/getUserName", { params: { userId } });
        setName(res.data.name);
      } catch (err) {
        console.error("Error fetching user name:", err);
        setName("Unknown");
      }
    };

    fetchUserName();
  }, [userId]);

  return name;
};
