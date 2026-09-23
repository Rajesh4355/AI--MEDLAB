export const BASE_URL = "/api/v1";
export const token = {
  toString: () => localStorage.getItem("token") || "",
  valueOf: () => localStorage.getItem("token") || "",
};
