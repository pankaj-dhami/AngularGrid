(function () {

    var app = angular.module('myApp', ["ui.bootstrap", 'ui.grid', 'ui.grid.resizeColumns', 'ui.grid.pagination', 'ui.grid.selection', 'angularjs-dropdown-multiselect']);
    app.run(function ($templateRequest) {
        $templateRequest('../App/Views/multiselectFilter.html')

    });
    app.filter('mapGender', function () {
        var genderHash = {
            1: 'male',
            2: 'female'
        };

        return function (input) {
            if (!input) {
                return '';
            } else {
                return genderHash[input];
            }
        };
    });

    app.controller('MainCtrl', function ($scope, $http, uiGridConstants, $compile, $rootScope) {

        var data = [];
        $scope.pagingOptions = { pageSize: 10, currentPage: 1 };
        $scope.totalItems = 0;
        $scope.numPages = 0;
        $scope.currPageSize = 0;
        $scope.gridFilter = [];
        $scope.appliedFilterNames = '';
        $scope.resetGrid = function () {

            $rootScope.$broadcast('resetGridFilter');
            $scope.pagingOptions.currentPage = 1;
            $scope.gridFilter = [];
            getPage();
        }
        var footerTemplate = "<div title='Reload Grid' class='cursorhand glyphicon glyphicon-refresh' ng-click='resetGrid()'> </div>&nbsp;" +
                            "<span ng-if='loading'> Loading Data...</span>" +
                            "<span ng-if='!loading'>Total Items : {{totalItems}} (Showing Items : {{currPageSize}})" +
                            "<span ng-show='gridFilter.length'> ({{ gridFilter.length }}) Filters applied </span>  </span>"

        var footerContent = $compile(footerTemplate)($scope);

        $scope.applyFilter = function (column, value, type, opt) {

            if (type == 'multiselect') {

                value = Enumerable.From(value)
                            .Where(function (x) { return x.Selected == true })
                            .Select(function (x) { return x.Text })
                            .ToArray().join();
            }
            var columnFilter = Enumerable.From($scope.gridFilter)
                .Where(function (x) { return x.column == column })
                .FirstOrDefault();

            var stopPropogetion = false;
            if (columnFilter === undefined) {

                if (value == '') {
                    stopPropogetion = true;
                    return;
                }
                else {

                    $scope.gridFilter.push({ column: column, value: value, opt: opt });
                }

            }
            else {
                if (value == '') {
                    var index = $scope.gridFilter.indexOf(columnFilter);
                    $scope.gridFilter.splice(index, 1)
                }
                else {
                    columnFilter.value = value;
                }
            }
            if (!stopPropogetion) {
                getPage();
            }
        }


        $scope.gridOptions = {

            showGridFooter: true,
            gridFooterTemplate: footerContent,
            // showColumnFooter: true,
            enableFiltering: true,
            enableGridMenu: false,
            //modifierKeysToMultiSelectCells: true,
            //paginationPageSizes: [10, 25, 50, 75],
            //paginationPageSize: 10,
            enablePaginationControls: false,
            useExternalPagination: true,
            useExternalFiltering: true,
            // useExternalSorting: true,
            // paginationTemplate: '<div class="ui-grid-cell-contents" style="background-color: Red;color: White">custom template</div>',
            columnDefs: [
                      {
                          field: 'name',
                          width: '20%',
                          filterHeaderTemplate:
                              $compile("<filter-template column='name' filter-type='textbox' filter-opt='cn' apply-filter='applyFilter(column,value,type,opt)'> </filter-template>")
                              ($scope)

                      },
                       {
                           name: 'age',
                           field: 'age', width: '30%',
                           filterHeaderTemplate:
                              $compile("<filter-template column='age' filter-type='textbox' filter-opt='cn' apply-filter='applyFilter(column,value,type,opt)'> </filter-template>")
                              ($scope)
                       },
                        {
                            name: "email",
                            field: 'email', width: '30%',
                            filterHeaderTemplate:
                                 $compile("<filter-template column='email' url='/Home/GetEmailIds' filter-type='multiselect' filter-opt='cn' apply-filter='applyFilter(column,value,type,opt)'> </filter-template>")
                                 ($scope)

                        },
                      {
                          field: 'gender',
                          cellFilter: 'mapGender',
                          filterHeaderTemplate:
                                 $compile("<filter-template column='gender' url='/Home/GetEmailIds' filter-type='multiselect' filter-opt='cn' apply-filter='applyFilter(column,value,type,opt)'> </filter-template>")
                                 ($scope)
                      }
            ],
            data: data,
            onRegisterApi: function (gridApi) {

                $scope.gridApi = gridApi;

                gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                    //debugger;

                    // getPage(newPage, pageSize);
                });

                gridApi.core.on.filterChanged($scope, function () {
                    var grid = this.grid;
                    //debugger;
                    //if (grid.columns[1].filters[0].term === 'male') {
                    //    $http.get('/data/100_male.json')
                    //    .success(function (data) {
                    //        $scope.gridOptions.data = data;
                    //    });
                    //} else if (grid.columns[1].filters[0].term === 'female') {
                    //    $http.get('/data/100_female.json')
                    //    .success(function (data) {
                    //        $scope.gridOptions.data = data;
                    //    });
                    //} else {
                    //    $http.get('/data/100.json')
                    //    .success(function (data) {
                    //        $scope.gridOptions.data = data;
                    //    });
                    //}
                });
            }

        };

        $scope.pageChanged = function () {

            getPage();
        };

        var getPage = function () {
            $scope.loading = true;
            var url = '/Home/GetItems'
            $http({
                method: "POST",
                url: url,
                data: { page: $scope.pagingOptions.currentPage, size: $scope.pagingOptions.pageSize, filters: $scope.gridFilter }
            }).success(function (response) {
                // debugger;
                $scope.totalItems = response.totalCount;
                $scope.currPageSize = response.pageSize;

                response.data.forEach(function (row) {
                    row.registered = Date.parse(row.registered);
                    row.gender = row.gender == 'male' ? 1 : 2;
                });
                $scope.gridOptions.data = response.data;

            }).finally(function () {
                $scope.loading = false;

            });
        }

        getPage();

    });

    app.directive('filterTemplate', function ($compile, $http, $templateCache) {

        return {

            restrict: 'E',
            replace: true,
            scope: {
                applyFilter: '&',
                column: '@',
                filterType: '@',
                filterOpt: '@',
            },
            controller: function ($scope) {

                $scope.multiHeaderText = '';

                $scope.$watch('rows', function (newValue, oldValue) {

                    var count = Enumerable.From(newValue)
                           .Where(function (x) { return x.Selected == true })
                           .ToArray().length;
                    if (count > 0) {
                        $scope.multiHeaderText = ' (' + count + ') Selected';
                    }
                    else {
                        $scope.multiHeaderText = ' Select';
                    }


                }, true);

                $scope.clearSearch = function () {
                    $scope.searchText = '';
                };

                $scope.select = function (type, $event) {

                    if (type == 'none') {
                        $scope.rows.forEach(function (row) {
                            row.Selected = false
                        });
                    }
                    else if (type == 'all') {

                        $scope.rows.forEach(function (row) {
                            row.Selected = true
                        });
                    }
                }
            },
            templateUrl: '../App/Views/filterTemplate.html',
            link: function (scope, element, attr, controller) {

                scope.$on('resetGridFilter', function (e) {
                    if (scope.rows != undefined) {
                        scope.rows.forEach(function (row) {
                            row.Selected = false
                        });

                    }
                    if (scope.value != undefined) {
                        scope.value = '';
                    }
                });

                $('[data-toggle=popover]').popover({
                    placement: 'bottom',
                    container: 'body',
                    html: true,
                    content: function () {

                        $("[data-toggle=popover]").popover('hide');

                        var tableTemplate = $templateCache.get('../App/Views/multiselectFilter.html');
                        $(this).next('.popper-content').find('.filterTable').empty();
                        $(this).next('.popper-content').find('.filterTable').html(tableTemplate)

                        return $compile($(this).next('.popper-content').html())(scope);
                    }
                });
                if (attr.filterType == 'multiselect') {
                    $http.get(attr.url).success(function (response) {

                        scope.rows = response;
                        console.log('list data loaded')
                    });
                }

                $('body').on('click', function (e) {
                    //only buttons
                    if ($(e.target).data('toggle') !== 'popover'
                        && $(e.target).parents('.popover.in').length === 0) {
                        $('[data-toggle="popover"]').popover('hide');
                    }
                    //buttons and icons within buttons
                    /*
                    if ($(e.target).data('toggle') !== 'popover'
                        && $(e.target).parents('[data-toggle="popover"]').length === 0
                        && $(e.target).parents('.popover.in').length === 0) { 
                        $('[data-toggle="popover"]').popover('hide');
                    }
                    */
                });

                $(window).resize(function () {

                    $("[data-toggle=popover]").popover('hide');

                    //popover.addClass("noTransition");
                    //$("input:focus").popover('show');
                    //popover.removeClass("noTransition");

                });
            }

        }
    });
})();
