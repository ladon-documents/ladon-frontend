import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NavigationComponent } from "./navigation.component";
import { DebugElement } from "@angular/core";
import { By } from "@angular/platform-browser";
import {NavigationEntry} from "../interfaces/navigation-entry";

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

const navigationTO = new NavigationTestObject();

describe("NavigationComponent", () => {
	let component: NavigationComponent, fixture: ComponentFixture<NavigationComponent>, debugElement: DebugElement;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [NavigationComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(NavigationComponent);
		component = fixture.componentInstance;
		debugElement = fixture.debugElement;
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});

	describe("test input", () => {
		it("main menu", () => {
			fixture.componentRef.setInput("navigation", navigationTO.returnMockNavigation());
			fixture.detectChanges();
	//		expect(component.mainMenu()).toHaveLength(4);
		});

		it("sub menu", () => {
			fixture.componentRef.setInput("navigation", navigationTO.returnMockNavigation());
			fixture.detectChanges();
	//		expect(component.subMenu()).toHaveLength(6);
		});
	});

	describe("test invokeItem", () => {
		let invokeItemSpy: any;
		beforeEach(() => {
			invokeItemSpy = jest.spyOn(component, "invokeItem");
			fixture.componentRef.setInput("navigation", navigationTO.returnMockNavigation());
			fixture.detectChanges();
		});

		it("action", () => {
			const navItems = debugElement.queryAll(By.css("nav li"));
			const actionItems = navItems.filter((item: DebugElement) => item.attributes["data-target"] === "action");
			actionItems[0].query(By.css("a")).triggerEventHandler("click");
	//		expect(invokeItemSpy).toHaveBeenCalledWith(expect.objectContaining({ target: "action" }));
		});
	});
});
