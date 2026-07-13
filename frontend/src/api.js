import axios from "axios";

const API = axios.create({
  baseURL: `http://${window.location.hostname || "localhost"}:5001/api`
});

export default API;