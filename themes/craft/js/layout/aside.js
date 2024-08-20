"use strict";

// Class definition
var KTAppAside = function () {
	// Private variables
	var aside;
	var menuWrapper;

	var handleMenuScroll = function() {
		var menuActiveItem = menuWrapper.querySelector(".menu-link.active");

		if ( !menuActiveItem ) {
			return;
		} 

		if ( KTUtil.isVisibleInContainer(menuActiveItem, menuWrapper) === true) {
			return;
		}

		menuWrapper.scroll({
			top: KTUtil.getRelativeTopPosition(menuActiveItem, menuWrapper),
			behavior: 'smooth'
		});
	}

	// Public methods
	return {
		init: function () {
			// Elements
			aside = document.querySelector('#kt_aside');
			menuWrapper = document.querySelector('#kt_aside_menu_wrapper');
			
			if ( aside === null ) {
				return;
			}

			if ( menuWrapper ) {
				handleMenuScroll();			
			}
		}
	};
}();

// On document ready
KTUtil.onDOMContentLoaded(function () {
	KTAppAside.init();
});