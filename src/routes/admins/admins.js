import query from "../../database";

export const createAdmin = async (admin) => {
  try {
    await query("INSERT INTO admin SET ?", admin);

    return true;
  } catch (error) {
    return false;
  }
};
