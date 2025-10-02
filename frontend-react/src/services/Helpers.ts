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