import { useEffect, useState } from "react";
import { getHealth } from "../services/healthService.js";

export function useApiHealth() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getHealth()
      .then((data) => {
        if (active) {
          setHealth(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setHealth(null);
          setError(err.message || "Unable to reach the ResearchX API");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { health, error, loading };
}
