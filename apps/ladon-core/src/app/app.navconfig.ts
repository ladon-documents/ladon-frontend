import { environment } from "@ladon/environment";
import { merge } from "lodash";

export const setNavigation = (navigation: any) => {
	merge(environment, { navigation });
};
