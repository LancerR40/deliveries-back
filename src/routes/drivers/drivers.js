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
      search: { page, fullname, identificationCode },
      fields,
    } = queries;

    const joined = fields.join(", ");

    let sql1 = `SELECT ${joined} FROM driver`;
    let sql2 = `SELECT COUNT(IDDriver) as counter FROM driver`;
    const params1 = [];

    if (fullname && !identificationCode) {
      sql1 += " WHERE Name LIKE ?";
      params1.push(fullname + "%");

      sql2 += " WHERE Name LIKE ?";
    }

    if (identificationCode && !fullname) {
      sql1 += " WHERE IdentificationCode LIKE ?";
      params1.push(identificationCode + "%");

      sql2 += " WHERE IdentificationCode LIKE ?";
    }

    if (page) {
      const counter = await query(sql2, params1);

      const limit = 8;
      const offset = Number(page) * limit - limit;

      sql1 += " LIMIT ? OFFSET ?";
      params1.push(limit);
      params1.push(offset);

      return {
        drivers: await query(sql1, params1),
        counter: counter[0].counter,
      };
    }

    return {
      drivers: await query(sql1, params1),
    };
  } catch (error) {
    return false;
  }
};
