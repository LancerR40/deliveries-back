import query from "../../database";

export const createAdmin = async (admin) => {
  try {
    await query("INSERT INTO admin SET ?", admin);

    return true;
  } catch (error) {
    return false;
  }
};

export const getAdminData = async (adminId) => {
  try {
    const result = await query(
      "SELECT Name as name, Lastname as lastname, Photo as photo FROM admin WHERE IDAdmin = ?",
      adminId
    );

    return result[0];
  } catch (error) {
    return false;
  }
};
