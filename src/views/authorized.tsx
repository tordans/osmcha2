import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { completeOAuthLogin } from "../utils/auth.ts";

const oauthCodesStarted = new Set<string>();

export function Authorized() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(
    function completeOAuthFromRedirect() {
      const params = new URLSearchParams(location.search);
      const authCode = params.get("code");

      if (!authCode) {
        navigate("/", { replace: true });
        return;
      }

      if (oauthCodesStarted.has(authCode)) return;
      oauthCodesStarted.add(authCode);

      completeOAuthLogin(authCode)
        .then(() => {
          navigate("/", { replace: true });
        })
        .catch((error) => {
          console.error("OAuth completion failed:", error);
          navigate("/", { replace: true });
        });
    },
    [location.search, navigate],
  );

  return <div className="center">Logging in...</div>;
}
