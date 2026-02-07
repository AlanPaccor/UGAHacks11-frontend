import axios from "axios";

const API = axios.create({
  baseURL: "", // proxied through Vite dev server
});

export default API;
