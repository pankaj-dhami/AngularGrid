(function () {

    var app = angular.module('myApp', ["ui.bootstrap", 'ui.grid', 'ui.grid.resizeColumns', 'ui.grid.pagination', 'ui.grid.selection', 'angularjs-dropdown-multiselect']);

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

    app.controller('MainCtrl', function ($scope, $http, uiGridConstants, $compile) {

        var data = [];
        $scope.pagingOptions = { pageSize: 10, currentPage: 1 };
        $scope.totalItems = 0;
        $scope.numPages = 0;
        $scope.currPageSize = 0;
        $scope.gridFilter = [];
        $scope.appliedFilterNames = '';

        var footerTemplate = "<div ng-if='loading'> Loading Data...</div>" +
                   "<div ng-if='!loading'>Total Items : {{totalItems}} (Showing Items : {{currPageSize}})" +
                   " <span ng-show='gridFilter.length'> ({{ gridFilter.length }}) Filters applied ( {{appliedFilterNames}} ) </span>  </div>";
        var footerContent = $compile(footerTemplate)($scope);

        $scope.applyFilter = function (column, value, type, opt) {

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

        var myHeaderCellTemplate = '<div class="ngHeaderSortColumn {{col.headerClass}}" ng-style="{cursor: col.cursor}" ng-class="{ ngSorted: !noSortVisible }">' +
                               '<div ng-click="col.sort($event)" ng-class="\'colt\' + col.index" class="ngHeaderText">{{col.displayName}}</div>' +
                               '<div class="ngSortButtonDown" ng-show="col.showSortButtonDown()"></div>' +
                               '<div class="ngSortButtonUp" ng-show="col.showSortButtonUp()"></div>' +
                               '<div class="ngSortPriority">{{col.sortPriority}}</div>' +
                             '</div>' +
                             '<div ng-show="col.resizable" class="ngHeaderGrip" ng-click="col.gripClick($event)" ng-mousedown="col.gripOnMouseDown($event)"></div>';

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
                                 $compile("<filter-template column='email' filter-type='multiselect' filter-opt='cn' apply-filter='applyFilter(column,value,type,opt)'> </filter-template>")
                                 ($scope)

                        },
                      {
                          field: 'gender',
                          cellFilter: 'mapGender',
                          filterHeaderTemplate:
                                 $compile("<filter-template column='gender' filter-type='multiselect' filter-opt='cn' apply-filter='applyFilter(column,value,type,opt)'> </filter-template>")
                                 ($scope)
                      }
            ],
            data: data,
            onRegisterApi: function (gridApi) {

                $scope.gridApi = gridApi;

                //gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                //    //debugger;

                //    getPage(newPage, pageSize);
                //});

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

    app.directive('filterTemplate', function () {

        return {

            restrict: 'E',
            replace: true,
            scope: {
                applyFilter: '&',
                column: '@',
                filterType: '@',
                filterOpt: '@'
            },
            controller: function ($scope) {

                $scope.keyup = function (e) {

                }

                $scope.filterDataList = [{ text: "pankaj", value: 1, selected: false }, { text: "dhami", value: 2, selected: false }];
                $scope.multiHeaderText = 'Select';
                $scope.filterDatamodel = [];

                $scope.example9settings = { enableSearch: true, externalIdProp: '' };


            },
            templateUrl: '../App/Views/filterTemplate.html',
            link: function (scope, element, attr, controller) {

                //$('.popper').popover({
                //    placement: 'bottom',
                //    container: 'body',
                //    html: true,
                //    content: function () {
                //        return $(this).next('.popper-content').html();
                //    },

                //    template: '<div class="popover popover-medium"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'

                //});

                $('[data-toggle=popover]').popover({
                    placement: 'bottom',
                    container: 'body',
                    html: true,
                    content: function () {
                        return $(this).next('.popper-content').html();
                    }

                });

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
