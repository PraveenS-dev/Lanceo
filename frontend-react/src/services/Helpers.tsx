import { useEffect, useState } from "react";
import categories from "../data/categories.json";
import experience from "../data/experience.json";
import skills from "../data/skills.json";
import { apiClient } from "./Auth";
import TicketReasons from "../data/TicketReasons.json";

export const getUserRole = (role: number) => {
  let Rolename;
  switch (role) {
    case 1:
      Rolename = "Admin"
      break;
    case 2:
      Rolename = "Freelancer"
      break;
    case 3:
      Rolename = "Client"
      break;
    default:
      Rolename = ""
      break;
  }

  return Rolename;
}

export const getProjectCategory = (categorie: number) => {
  let CategoryName = categories[categorie];
  return CategoryName;
}

export const getProjectExperience = (exp: number) => {
  let Experience = experience[exp];
  return Experience;
}

export const getProjectSkill = (skill: any) => {
  if (!skill) return "";

  const skillIds = String(skill).split(",").map((s) => Number(s.trim()));

  const skillNames = skillIds.map((id) => skills[id] || "").filter(Boolean);

  return skillNames.join(", ");
}

export const String_to_Array = (str: string, separator = ","): string[] => {
  if (!str) return [];
  return str.split(separator).map(s => s.trim()); // trim removes extra spaces
};

export const getProjectBudgetType = (type: number) => {
  let Typename;
  switch (type) {
    case 1:
      Typename = "Hourly Pay"
      break;
    case 2:
      Typename = "Fixed Pay"
      break;
    default:
      Typename = ""
      break;
  }

  return Typename;
}

export const displayDateFormat = (fullDate: Date) => {
  const date = new Date(fullDate);
  const formatted = date.toLocaleDateString("en-GB");
  return formatted;

}

export const displayDateTimeFormat = (fullDate: Date | string) => {
  const date = new Date(fullDate);

  const formattedDate = date.toLocaleDateString("en-GB"); // DD/MM/YYYY
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // 12-hour format with AM/PM
  });

  return `${formattedDate} ${formattedTime}`;
};

const role_options = [
  { value: "1", label: "Admin" },
  { value: "2", label: "Freelancer" },
  { value: "3", label: "Client" },
];

export const getLeftmenuRole = (role: any) => {
  if (!role) return "";

  const roleIds = Array.isArray(role)
    ? role.map(String)
    : String(role).split(",").map((s) => s.trim());

  const roleNames = roleIds
    .map((id) => role_options.find((r) => r.value === id)?.label)
    .filter(Boolean);

  return roleNames.join(", ");
};


export const getIsParent = (type: number) => {
  let Typename;
  switch (type) {
    case 1:
      Typename = "Yes"
      break;
    case 0:
      Typename = "No"
      break;
    default:
      Typename = "No"
      break;
  }

  return Typename;
}

export const useParentName = (parentId?: string) => {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (!parentId) return;

    const fetchParentName = async () => {
      try {
        const res = await apiClient.get("/LeftMenu/getParentName", { params: { parentId } });
        setName(res.data.name);
      } catch (err) {
        console.error("Error fetching Parent name:", err);
        setName("Unknown");
      }
    };

    fetchParentName();
  }, [parentId]);

  return name;
};

export const useProjectNames = (projectIds: string[]) => {
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!projectIds?.length) return;

    const fetchNames = async () => {
      try {
        const res = await apiClient.get("/projects/getMultipleNames", {
          params: { ids: projectIds.join(",") },
        });
        setNames(res.data.names);
      } catch (err) {
        console.error("Error fetching project names:", err);
      }
    };

    fetchNames();
  }, [projectIds]);

  return names;
};

export const getThreeStatus = (Status: number) => {
  switch (Status) {
    case 1:
      return (
        <span className="inline-flex items-center gap-1 bg-yellow-600 text-white rounded-3xl px-3 py-1 text-xs font-semibold shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="6" strokeWidth={2} />
          </svg>
          Pending
        </span>
      );
    case 2:
      return (
        <span className="inline-flex items-center gap-1 bg-green-600 text-white rounded-3xl px-3 py-1 text-xs font-semibold shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Approved
        </span>
      );
    case 3:
      return (
        <span className="inline-flex items-center gap-1 bg-red-600 text-white rounded-3xl px-3 py-1 text-xs font-semibold shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Rejected
        </span>
      );
    default:
      return null;
  }
};

export const getContractStatus = (status: number) => {
  let text = "";
  let style = "";

  switch (status) {
    case 1:
      text = "Payment Pending";
      style = "bg-yellow-100 text-yellow-700";
      break;
    case 2:
      text = "Working";
      style = "bg-blue-100 text-blue-700";
      break;
    case 3:
      text = "Ticket Raised";
      style = "bg-orange-100 text-orange-700";
      break;
    case 4:
      text = "Ticket Closed";
      style = "bg-green-100 text-green-700";
      break;
    case 5:
      text = "Project Submitted";
      style = "bg-purple-100 text-purple-700";
      break;
    case 6:
      text = "Completed";
      style = "bg-emerald-100 text-emerald-700";
      break;
    case 7:
      text = "Re-work Needed";
      style = "bg-red-100 text-red-700";
      break;
    default:
      text = "No Status";
      style = "bg-gray-100 text-gray-600";
      break;
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${style}`}>
      {text}
    </span>
  );
};

export const getTransactionType = (type: Number) => {
  let text = "";
  let style = "";

  switch (type) {
    case 1:
      text = "Received";
      style = "text-green-700";
      break;
    case 2:
      text = "Sent";
      style = "text-red-700";
      break;
    default:
      text = "";
      style = "bg-gray-100 text-gray-600";
      break;
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${style}`}>
      {text}
    </span>
  );
}

export const getTicketStatus = (type: Number) => {
  let text = "";
  let style = "";

  switch (type) {
    case 1:
      text = "Refund pending";
      style = "text-white bg-yellow-500";
      break;
    case 2:
      text = "closed";
      style = "bg-green-700 text-white";
      break;
    case 2:
      text = "canceled";
      style = "bg-red-500 text-white";
      break;
    default:
      text = "";
      style = "bg-gray-100 text-gray-600";
      break;
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${style}`}>
      {text}
    </span>
  );
}

export const getTicketReason = (reason: number) => {
  const found = TicketReasons.find(item => item.value === reason);
  return found ? found.label : "Unknown Reason";
};
