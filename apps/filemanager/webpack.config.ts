import {shareAll, withModuleFederationPlugin} from "@angular-architects/module-federation/webpack";

module.exports = withModuleFederationPlugin({
  name: "filemanager",

  exposes: {
    "./routes": "./apps/filemanager/src/app/remote-entry/entry-routes.ts",
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: "auto" }),
  }

});
