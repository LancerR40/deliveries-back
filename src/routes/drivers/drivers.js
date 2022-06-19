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
    const { search } = queries;

    let sql1 = `SELECT IDDriver as driverId, Name as name, Lastname as lastname, IdentificationCode as identificationCode, Gender as gender, Photo as photo, Email as email, CreatedAt as createdAt FROM driver`; /* prettier-ignore */
    let sql2 = `SELECT COUNT(IDDriver) as counter FROM driver`;
    const params = [];

    if (search.field) {
      sql1 += ` WHERE Name LIKE ? OR IdentificationCode LIKE ?`;
      sql2 += ` WHERE Name LIKE ? OR IdentificationCode LIKE ?`;

      params.push(search.field + "%", search.field + "%");
    }

    if (search.page) {
      const counter = await query(sql2, params);

      const limit = 8;
      const offset = Number(search.page) * limit - limit;

      sql1 += " LIMIT ? OFFSET ?";
      params.push(limit);
      params.push(offset);

      return {
        drivers: await query(sql1, params),
        counter: counter[0].counter,
      };
    }

    return {
      drivers: await query(sql1, params),
    };
  } catch (error) {
    return false;
  }
};
