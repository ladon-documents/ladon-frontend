import { NavigationEntry } from "../src/interface/navigation-entry";

export class NavigationTestObject {
	returnMockNavigation(): NavigationEntry[] {
		return [
			{
				label: "BUCKET_MANAGER.NAVITEM",
				id: "@mind/mf-ladon-buckets",
				icon: "heroFolder",
				target: "internal",
				type: "main",
				index: 10,
			},
			{
				label: "",
				id: "@mind/mf-ladon-dashboard",
				target: "internal",
				type: "main",
				index: 0,
			},
			{
				label: "DOCMANAGER.NAVITEM",
				id: "@mind/mf-ladon-docmanager",
				target: "internal",
				icon: "heroDocumentText",
				type: "main",
				index: 20,
			},
			{
				label: "NAVIGATION.SUBNAV.REST_API",
				target: "external",
				path: "/admin/swagger-ui.html",
				type: "menu",
				index: 40,
			},
			{
				label: "Documentation",
				target: "external",
				path: "https://ladon.org/doc",
				type: "menu",
				index: 40,
			},
			{
				label: "NAVIGATION.SUBNAV.LOGOUT",
				icon: "heroArrowRightStartOnRectangle",
				id: "ladon:logout",
				target: "action",
				type: "menu",
				index: 50,
			},
			{
				label: "PLUGIN.NAVITEM",
				id: "@mind/mf-ladon-plugin",
				target: "internal",
				type: "menu",
				index: 30,
			},
			{
				label: "SHARE.NAVITEM",
				id: "@mind/mf-ladon-share",
				target: "internal",
				type: "menu",
				index: 20,
			},
			{
				label: "STATIC.TASKMANAGER",
				path: "_ui/task-manager/module.html",
				id: "@mind/mf-ladon-static-page",
				icon: "heroListBullet",
				target: "static",
				type: "main",
				index: 40,
			},
			{
				label: "USER_MANAGER.NAVITEM",
				target: "internal",
				id: "@mind/mf-ladon-user-manager",
				type: "menu",
				index: 10,
			},
		];
	}
}
