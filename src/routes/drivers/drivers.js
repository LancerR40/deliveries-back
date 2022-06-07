import query from "../../database";

export const createDriver = async (driver) => {
  try {
    await query("INSERT INTO driver SET ?", driver);

    return true;
  } catch (error) {
    return false;
  }
};
