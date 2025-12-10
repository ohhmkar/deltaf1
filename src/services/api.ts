export const API_BASE = "https://api.jolpi.ca/ergast/f1";

export const fetchData = async (endpoint: string): Promise<any> => {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    const data = await res.json();
    return data.MRData;
  } catch (error) {
    console.error("API Error:", error);
    return null;
  }
};
