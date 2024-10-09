import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NavigationComponent } from "./navigation.component";
import { NavigationTestObject } from "../../../tests/navigation-test-object";
import { ComponentRef } from "@angular/core";

const navigationTO = new NavigationTestObject();

describe("NavigationComponent", () => {
	let component: NavigationComponent,
		componentRef: ComponentRef<NavigationComponent>,
		fixture: ComponentFixture<NavigationComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [NavigationComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(NavigationComponent);
		component = fixture.componentInstance;
		componentRef = fixture.componentRef;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});

	it("test input", () => {
		componentRef.setInput("navigation", navigationTO.returnMockNavigation());
		fixture.detectChanges();
	});
});
