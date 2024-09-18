import { ModuleFederationConfig } from "@nx/webpack";

const config: ModuleFederationConfig = {
	name: "filemanager",
	exposes: {
		"./Routes": "apps/filemanager/src/app/remote-entry/entry.routes.ts",
	},
};

export default config;
