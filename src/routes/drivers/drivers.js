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

export const getDriversByQueries = async (queries) => {
  try {
    const {
      search: { fullname, identificationCode },
      fields,
    } = queries;

    const joined = fields.join(", ");

    if (fullname) {
      return await query(`SELECT ${joined} FROM driver WHERE Name LIKE ?`, [fullname + "%"]);
    }

    if (identificationCode) {
      return await query(`SELECT ${joined} FROM driver WHERE IdentificationCode LIKE ?`, [identificationCode + "%"]); /* prettier-ignore */
    }
  } catch (error) {
    return false;
  }
};
