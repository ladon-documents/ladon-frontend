import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NavigationComponent } from "./navigation.component";
import { NavigationTestObject } from "../../../tests/navigation-test-object";
import { DebugElement } from "@angular/core";
import { By } from "@angular/platform-browser";

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
			expect(component.mainMenu()).toHaveLength(4);
		});

		it("sub menu", () => {
			fixture.componentRef.setInput("navigation", navigationTO.returnMockNavigation());
			fixture.detectChanges();
			expect(component.subMenu()).toHaveLength(6);
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
			expect(invokeItemSpy).toHaveBeenCalledWith(expect.objectContaining({ target: "action" }));
		});
	});
});
