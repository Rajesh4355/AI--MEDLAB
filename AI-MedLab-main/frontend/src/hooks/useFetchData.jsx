import { useEffect, useState } from "react";

const useFetchData = (url) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const currentToken = localStorage.getItem("token");
        const headers =
          currentToken && currentToken !== "null"
            ? { Authorization: `Bearer ${currentToken}` }
            : {};
        const res = await fetch(url, { headers });
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
