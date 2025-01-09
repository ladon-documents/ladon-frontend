import {shareAll, withModuleFederationPlugin} from "@angular-architects/module-federation/webpack";

module.exports = withModuleFederationPlugin({

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: "auto" }),
  }

});
