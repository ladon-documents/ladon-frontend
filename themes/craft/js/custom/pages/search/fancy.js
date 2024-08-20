"use strict";
 
// Class definition
var KTSearchFancy = function () {
    // Private functions
    var initAdvancedSearchForm = function () {
       var form = document.querySelector('#kt_advanced_search_form');

       // Init tags
       var tags = form.querySelector('[name="tags"]');
       new Tagify(tags);
    }

    var handleAdvancedSearchToggle = function () {
        var link = document.querySelector('#kt_advanced_search_link');
        var button1 = document.querySelector('#kt_advanced_search_button_1');

        link.addEventListener('click', function (e) {
            e.preventDefault();
            
            if (link.innerHTML === "Advanced Search") {
                link.innerHTML = "Hide Advanced Search";
                button1.classList.add('d-none');
            } else {
                link.innerHTML = "Advanced Search";
                button1.classList.remove('d-none');
            }
        })
    }

    // Public methods
    return {
        init: function () {
            initAdvancedSearchForm();
            handleAdvancedSearchToggle();
        }
    }     
}();

// On document ready
KTUtil.onDOMContentLoaded(function () {
    KTSearchFancy.init();
});
