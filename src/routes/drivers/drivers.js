import query from "../../database";

export const createDriver = async (driver) => {
  try {
    await query("INSERT INTO driver SET ?", driver);

    return true;
  } catch (error) {
    return false;
  }
};

export const createDriverDocument = async (document) => {
  try {
    await query("INSERT INTO driver_document SET ?", document);

    return true;
  } catch (error) {
    return false;
  }
};

export const getDriverIdByIdentificationCode = async (code) => {
  try {
    const result = await query("SELECT IDDriver FROM driver WHERE IdentificationCode = ?", code);

    return result[0].IDDriver;
  } catch (error) {
    return false;
  }
};
