"use strict";

// Class definition
var KTWidgets = function () {
    // Chart widgets based on Apexcharts. For more info check the official documentation:  https://apexcharts.com/
    var initChartWidget1 = function() {
        var chart = {
            self: null,
            rendered: false
        };

        var element = document.getElementById("kt_chart_widget_1_chart");
        var height = parseInt(KTUtil.css(element, 'height'));

        if ( !element ) {
            return;
        }

        var init = function() {
            var options = {
                series: [{
                    name: 'Net Profit',
                    data: [30, 30, 43, 43, 34, 34, 26, 26, 47, 47]
                }],
                chart: {
                    fontFamily: 'inherit',
                    type: 'area',
                    height: height,
                    toolbar: {
                        show: false
                    },
                    zoom: {
                        enabled: false
                    },
                    sparkline: {
                        enabled: true
                    }
                },
                plotOptions: {},
                legend: {
                    show: false
                },
                dataLabels: {
                    enabled: false
                },
                fill: {
                    type: 'solid',
                    opacity: 0.075
                },
                stroke: {
                    curve: 'smooth',
                    show: true,
                    width: 3,
                    colors: [KTUtil.getCssVariableValue('--bs-primary')]
                },
                xaxis: {
                    categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
                    axisBorder: {
                        show: false,
                    },
                    axisTicks: {
                        show: false
                    },
                    labels: {
                        show: false,
                        style: {
                            colors: KTUtil.getCssVariableValue('--bs-gray-500'),
                            fontSize: '12px',
                        }
                    },
                    crosshairs: {
                        show: false,
                        position: 'front',
                        stroke: {
                            color: KTUtil.getCssVariableValue('--bs-gray-200'),
                            width: 1,
                            dashArray: 3
                        }
                    },
                    tooltip: {
                        enabled: true,
                        formatter: undefined,
                        offsetY: 0,
                        style: {
                            fontSize: '12px'
                        }
                    }
                },
                yaxis: {
                    min: 0,
                    max: 60,
                    labels: {
                        show: false,
                        style: {
                            colors: KTUtil.getCssVariableValue('--bs-gray-500'),
                            fontSize: '12px'
                        }
                    }
                },
                states: {
                    normal: {
                        filter: {
                            type: 'none',
                            value: 0
                        }
                    },
                    hover: {
                        filter: {
                            type: 'none',
                            value: 0
                        }
                    },
                    active: {
                        allowMultipleDataPointsSelection: false,
                        filter: {
                            type: 'none',
                            value: 0
                        }
                    }
                },
                tooltip: {
                    style: {
                        fontSize: '12px'
                    },
                    y: {
                        formatter: function(val) {
                            return "$" + val + " sales"
                        }
                    }
                },   
                colors: [KTUtil.getCssVariableValue('--bs-primary')],            
                markers: {
                    colors: [KTUtil.getCssVariableValue('--bs-primary-light')],
                    strokeColor: [KTUtil.getCssVariableValue('--bs-primary')],
                    strokeWidth: 3
                }
            };

            chart.self = new ApexCharts(element, options);

            // Set timeout to properly get the parent elements width
            setTimeout(function() {
                chart.self.render();
                chart.rendered = true;
            }, 200); 
        }

        init();

       // Update chart on theme mode change
        KTThemeMode.on("kt.thememode.change", function() {                
            if (chart.rendered) {
                chart.self.destroy();
            }

            init();
        });
    }  

    var initChartWidget2 = function() {
        var chart = {
            self: null,
            rendered: false
        };

        var element = document.getElementById("kt_charts_widget_2_chart");
        var height = parseInt(KTUtil.css(element, 'height'));        

        if (!element) {
            return;
        }

        var init = function() {
            var labelColor = KTUtil.getCssVariableValue('--bs-gray-500');
            var borderColor = KTUtil.getCssVariableValue('--bs-gray-200');
            var baseColor = KTUtil.getCssVariableValue('--bs-primary');
            var secondaryColor = KTUtil.getCssVariableValue('--bs-gray-300');

            var options = {
                series: [{
                    name: 'Net Profit',
                    data: [30, 60, 80, 60, 30, 60, 80, 100, 80, 60, 60],
                    margin: {
                        left: 5,
                        right: 5
                    }   
                }, {
                    name: 'Revenue',
                    data: [30, 60, 80, 60, 30, 60, 80, 100, 80, 60, 60]
                }],
                chart: {
                    fontFamily: 'inherit',
                    type: 'bar',
                    height: height,
                    toolbar: {
                        show: false
                    }
                },
                plotOptions: {
                    bar: {
                        horizontal: false,
                        columnWidth: ['50%'],
                        borderRadius: 4
                    },
                },
                legend: {
                    show: false
                },
                dataLabels: {
                    enabled: false
                },
                stroke: {
                    show: true,
                    width: 2,
                    colors: ['transparent']
                },
                xaxis: {                
                    axisBorder: {
                        show: false,
                    },
                    axisTicks: {
                        show: false
                    },
                    labels: {
                        show: false,
                        style: {
                            colors: labelColor,
                            fontSize: '12px'
                        }
                    }
                },
                yaxis: {
                    labels: {
                        show: false,
                        style: {
                            colors: labelColor,
                            fontSize: '12px'
                        }
                    }
                },
                fill: {
                    type: 'solid'
                },
                states: {
                    normal: {
                        filter: {
                            type: 'none',
                            value: 0
                        }
                    },
                    hover: {
                        filter: {
                            type: 'none',
                            value: 0
                        }
                    },
                    active: {
                        allowMultipleDataPointsSelection: false,
                        filter: {
                            type: 'none',
                            value: 0
                        }
                    }
                },
                tooltip: {
                    style: {
                        fontSize: '12px'
                    },
                    y: {
                        formatter: function (val) {
                            return "$" + val + " revenue"
                        }
                    }
                },
                colors: [baseColor, secondaryColor],
                grid: {
                    borderColor: borderColor,
                    strokeDashArray: 4,
                    yaxis: {
                        lines: {
                            show: true
                        }
                    },
                    padding: {
                        left: -10,
                        right: 5      
                    }               
                }
            };

            chart.self = new ApexCharts(element, options);

            // Set timeout to properly get the parent elements width
            setTimeout(function() {
                chart.self.render();
                chart.rendered = true;
            }, 200); 
        }   
        
        init();

        // Update chart on theme mode change
        KTThemeMode.on("kt.thememode.change", function() {                
            if (chart.rendered) {
                chart.self.destroy();
            }

            init();
        });
    }
    
    var initChartWidget3 = function(tabSelector, chartSelector, data, initByDefault) {
        var element = document.querySelector(chartSelector);
        var height = parseInt(KTUtil.css(element, 'height'));

        if (!element) {
            return;
        }

        var options = {
            series: [{
                name: 'Profit',
                data: data
            }],
            chart: {
                fontFamily: 'inherit',
                type: 'bar',
                height: height,
                toolbar: {
                    show: false
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: ['30%'],
                    borderRadius: 4
                },
            },
            legend: {
                show: false
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
            },
            xaxis: {
                crosshairs: {
                    show: false
                },
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                axisBorder: {
                    show: false,
                },
                axisTicks: {
                    show: false
                },
                labels: {
                    style: {
                        colors: KTUtil.getCssVariableValue('--bs-gray-400'),
                        fontSize: '12px'
                    }
                }
            },
            yaxis: {
                crosshairs: {
                    show: false
                },
                labels: {
                    style: {
                        colors: KTUtil.getCssVariableValue('--bs-gray-400'),
                        fontSize: '12px'
                    }
                }
            },
            states: {
                normal: {
                    filter: {
                        type: 'none',
                        value: 0
                    }
                },
                hover: {
                    filter: {
                        type: 'none',
                    }
                },
                active: {
                    allowMultipleDataPointsSelection: false,
                    filter: {
                        type: 'none',
                        value: 0
                    }
                }
            },
            fill: {
                opacity: 1
            },            
            tooltip: {
                style: {
                    fontSize: '12px'
                },
                y: {
                    formatter: function (val) {
                        return "$" + val + "k"
                    }
                }
            },
            colors: [KTUtil.getCssVariableValue('--bs-primary')],
            grid: {
                borderColor: KTUtil.getCssVariableValue('--bs-gray-300'),
                strokeDashArray: 4,
                yaxis: {
                    lines: {
                        show: true
                    }
                }
            }
        };

        var chart = new ApexCharts(element, options);

        var init = false;
        var tab = document.querySelector(tabSelector);
        
        if (initByDefault === true) {
            chart.render();
            init = true;
        }        

        tab.addEventListener('shown.bs.tab', function (event) {
            if (init == false) {
                chart.render();
                init = true;
            }
        })
    } 

    var initChartWidget4 = function() {
        var element = document.getElementById("kt_chart_widget_4_chart");
        var height = parseInt(KTUtil.css(element, 'height'));

        if (!element) {
            return;
        }

        var options = {
            series: [74],
            chart: {
                fontFamily: 'inherit',
                height: height,
                type: 'radialBar',
                offsetY: 0
            },
            plotOptions: {
                radialBar: {
                    startAngle: -90,
                    endAngle: 90,

                    hollow: {
                        margin: 0,
                        size: "70%"
                    },
                    dataLabels: {
                        showOn: "always",
                        name: {
                            show: true,
                            fontSize: "13px",
                            fontWeight: "700",
                            offsetY: -5,
                            color: KTUtil.getCssVariableValue('--bs-gray-500')
                        },
                        value: {
                            color: KTUtil.getCssVariableValue('--bs-gray-700'),
                            fontSize: "30px",
                            fontWeight: "700",
                            offsetY: -40,
                            show: true
                        }
                    },
                    track: {
                        background: KTUtil.getCssVariableValue('--bs-primary-light'),
                        strokeWidth: '100%'
                    }
                }
            },
            colors: [KTUtil.getCssVariableValue('--bs-primary')],
            stroke: {
                lineCap: "round",
            },
            labels: ["My Achievements"]
        };

        var chart = new ApexCharts(element, options);
        chart.render();
    }   

    // Show more feeds
    var initFeedsWidget4 = function() {
        var btn = document.querySelector('#kt_widget_5_load_more_btn');
        var widget5 = document.querySelector('#kt_widget_5');

        if (btn) {
            btn.addEventListener('click', function(e){
                e.preventDefault();
                btn.setAttribute('data-kt-indicator', 'on');

                setTimeout(function() {
                    btn.removeAttribute('data-kt-indicator');
                    widget5.classList.remove('d-none');         
                    btn.classList.add('d-none');         
                    
                    KTUtil.scrollTo(widget5, 200);
                }, 2000);                
            });
        }                 
    }

    // Dark mode toggler
	var initDarkModeToggle = function() {
        var toggle = document.querySelector('#kt_user_menu_dark_mode_toggle');
        
        if (toggle) {
            toggle.addEventListener('click', function() {
                window.location.href = this.getAttribute('data-kt-url');
            });
        }
    }
    
    // Public methods
    return {
        init: function () {
            // Dark mode
            initDarkModeToggle();
            
            // Chart widgets
            initChartWidget1();  
            initChartWidget2();            

            initChartWidget3('#kt_charts_widget_3_tab_1', '#kt_charts_widget_3_chart_1', [30, 40, 30, 25, 40, 45, 30, 20, 40, 25, 20, 30], true);            

            initChartWidget3('#kt_charts_widget_3_tab_2', '#kt_charts_widget_3_chart_2', [25, 30, 25, 45, 30, 40, 30, 25, 40, 20, 25, 30], false);
      
            initChartWidget4();          
            
            // Feeds widgets
            initFeedsWidget4();
        }
    }
}();

// On document ready
KTUtil.onDOMContentLoaded(function() {
    KTWidgets.init();
});