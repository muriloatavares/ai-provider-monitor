/**
 * @file useApi.js
 * @description Hook genérico para consumo de endpoints REST.
 *
 * Gerencia estados de loading, data e error para chamadas GET simples.
 * (O streaming é gerenciado separadamente pelo useKeyChecker).
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import { useState, useEffect } from "react";

export function useApi(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // The Vite proxy routes /api to http://localhost:3000/api
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}`);
        }
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
}
