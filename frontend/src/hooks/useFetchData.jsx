import { useEffect, useState } from "react";
import { token } from "../config.js";

const useFetchData = (url) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const currentToken = localStorage.getItem("token") || token;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.message + "🤢");
        }
        setData(result.data);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError(err.message);
      }
    };
    fetchData();
  }, [url]);
  return { data, loading, error };
};

export default useFetchData;
