import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const fetchTracker = async (monthSort) => {
  const response = await axios.get(`${API}/tracker`, {
    params: monthSort ? { month: monthSort } : {},
  });
  return response.data;
};