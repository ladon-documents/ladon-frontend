import { environment } from "@ladon/environment";
import { merge } from "lodash";
import { navigationConfig } from "../main";

export const setNavigation = () => {
	merge(environment, { navigation: navigationConfig });
};
