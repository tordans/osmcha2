import { isLocalOAuthHost } from "../utils/auth.ts";
import { SignInButton } from "./changeset/sign_in_button.tsx";
import { TokenImport } from "./token_import.tsx";

export function SignIn() {
  const localOAuth = isLocalOAuthHost();

  return (
    <div className="flex-parent flex-parent--column flex-parent--center-cross bg-gray-faint hfull-55">
      <div className="flex-child flex-child--grow">&nbsp;</div>
      <div className="flex-parent flex-parent--column flex-parent--center-cross">
        <svg className="icon h160 w160 inline-block align-middle pb3">
          <use xlinkHref="#icon-osm" />
        </svg>
      </div>
      <div className="flex-parent flex-parent--column align-center txt-l txt-bold pt12">
        {localOAuth
          ? "Sign in with your OpenStreetMap account to use OSMCha."
          : "Paste your OSMCha API token to use OSMCha."}
      </div>
      <div className="flex-parent flex-parent--column align-center txt-l pt36">
        {localOAuth ? (
          <SignInButton
            className="border--darken5 border--darken25-on-hover bg-gray-light color-gray-dark"
            text="Sign in"
          />
        ) : (
          <TokenImport />
        )}
      </div>
      <div className="flex-child flex-child--grow">&nbsp;</div>
    </div>
  );
}
