import User from "../model/User";
import fs from "fs";
import path from "path";


export const getEmailIdFromROles = async (role: string | string[]) => {
    const rolesArray = Array.isArray(role) ? role : [role];

    const users = await User.find({ role: { $in: rolesArray } });
    return users.map((user) => (user.email));
}

export const getUserIdFromROles = async (role: string | string[]) => {
    const rolesArray = Array.isArray(role) ? role : [role];

    const users = await User.find({ role: { $in: rolesArray } });
    return users.map((user) => user._id.toString());
}

export const loadEmailTemplate = (templateName: string, variables: Record<string, string>) => {
  const filePath = path.join(__dirname, "emailTemplates", `${templateName}.html`);
  let html = fs.readFileSync(filePath, "utf8");

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    html = html.replace(regex, value);
  }

  return html;
};