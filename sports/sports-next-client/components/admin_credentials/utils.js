export const convertConnectionFieldsToUrl = (fields) => {
  const { username, password, host, port, database } = fields;
  if (host.includes("localhost") && !username) {
    return `postgresql://${host}:${port}/${database}`;
  }
  return `postgresql://${username}:${password}@${host}:${port}/${database}`;
};

export const convertConnectionUrlToFields = (url) => {
  const values = {};
  if (url.includes("@")) {
    const split = url.split("@");
    const user_pass = split[0].split("//")[1];
    const host_port = split[1].split("/")[0];
    const database = split[1].split("/")[1];
    values["username"] = user_pass.split(":")[0];
    values["password"] = user_pass.split(":")[1];
    values["host"] = host_port.split(":")[0];
    values["database"] = database;
    values["port"] = 5432;
    return values;
  }
  try {
    // it might just be host:port/database
    const split = url.split("//");
    const host_info = split[1].split("/")[0];
    const host_port = host_info.split(":")[1];
    const host_name = host_info.split(":")[0];
    const database = split[1].split("/")[1];

    values["database"] = database;
    values["port"] = host_port;
    values["host"] = host_name;
    return values;
  } catch (e) {
    console.log("error: ", e);
    console.log("values so far:", values);
    return {};
  }
};
