import { useEffect, useState } from "react";
import { BmsApi } from "@/api/bms";

type CurrentUser = {
  name?: string;
  username?: string;
  email?: string;
  roles: string[];
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await BmsApi.getCurrentUser();
        setUser(res);
      } catch (err) {
        console.error("Failed to load user", err);
      }
    }

    loadUser();
  }, []);

  return user;
}