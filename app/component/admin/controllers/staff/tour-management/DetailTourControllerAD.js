travel_app.controller('DetailTourControllerAD', function ($scope, $sce, $location, $routeParams, $timeout, $http, MapBoxService, TourDetailsServiceAD, ToursServiceAD, AccountServiceAD) {
    $scope.isLoading = true;

    $scope.tourDetail = {
        tourDetailId: null,
        guideId: null,
        departureDate: null,
        arrivalDate: null,
        numberOfGuests: null,
        minimumNumberOfGuests: null,
        unitPrice: null,
        tourDetailNotes: null,
        tourDetailStatus: null,
        dateCreated: null,
        tourDetailDescription: null,
        fromLocation: null,
        toLocation: null,
        tourDetailImage: null
    };

    let searchTimeout;

    $scope.tourDetailList = []; // Biến để lưu danh sách tours
    $scope.currentPage = 0; // Trang hiện tại
    $scope.pageSize = 5; // Số lượng tours trên mỗi trang

    let tourDetailId = $routeParams.id;

    $scope.tourTypeList = [];

    $scope.invalidPriceFormat = false;

    $scope.provinceDestination = [{type: 'select', hasData: false}];

    function errorCallback() {
        $location.path('/admin/internal-server-error')
    }

    $scope.setTouched = function () {
        $scope.activityInDayTouched = true;
    };

    $scope.isActive = function () {
        return $scope.activityInDayTouched &&
            ($scope.tourDetail.tourDetailDescription === null ||
                $scope.tourDetail.tourDetailDescription === undefined ||
                $scope.tourDetail.tourDetailDescription === '');
    };

    /**
     * Phương thức mở modal
     */
    $scope.openModal = function (tourDetailId) {
        $('#modal-tour-detail').modal('show');

        if (!tourDetailId) return;

        TourDetailsServiceAD.findTourDetailById(tourDetailId)
            .then(response => {
                if (response.status === 200) {
                    $timeout(function () {
                        $scope.tourDetail = response.data.data;
                        $scope.tourDetailImage = response.data.data.tourDetailImagesById;
                        $scope.tourDetail.departureDate = new Date(response.data.data.departureDate);
                        $scope.tourDetail.arrivalDate = new Date(response.data.data.arrivalDate);

                        let fromLocation = $scope.tourDetail.fromLocation;
                        let toLocation = $scope.tourDetail.toLocation;

                        MapBoxService.geocodeAddressGetKilometer(fromLocation)
                            .then(function (fromCoords) {
                                return MapBoxService.geocodeAddressGetKilometer(toLocation).then(function (toCoords) {
                                    const distance = $scope.calculateDistance(fromCoords, toCoords);
                                    document.getElementById("expectedKm").innerText = distance + ' Km (Kilometer)';
                                });
                            })
                            .catch(function (error) {
                                console.error("Lỗi khi tính toán khoảng cách:", error);
                            });

                        $scope.filteredProvinces = $scope.provinces.filter(function (province) {
                            return province.Name !== fromLocation && province.Name !== toLocation;
                        });
                    }, 0);
                }
            })
            .catch(errorCallback);
    }

    $scope.calculateDistance = function (coords1, coords2) {
        const R = 6371;
        const lat1 = coords1.lat * Math.PI / 180;
        const lat2 = coords2.lat * Math.PI / 180;
        const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
        const dLng = (coords2.lng - coords1.lng) * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c;
        return Math.round(distance);
    }

    /**
     * Phương thức đóng modal
     */
    $scope.closeModal = function () {
        $('#modal-tour-detail').modal('hide');
    };

    /**
     * Thêm địa chỉ tham quan vào trong lịch trình của tour
     * @param index
     */
    $scope.provinceDestination = [{type: 'select', hasData: false}];

    $scope.addOrRemoveSelectItem = function (index) {
        $scope.provinceDestination[index].hasData = !$scope.provinceDestination[index].hasData;
        if ($scope.provinceDestination[index].hasData) {
            $scope.provinceDestination.splice(index + 1, 0, {type: 'select', hasData: false});
        } else {
            $scope.provinceDestination.splice(index, 1);
        }
    };

    $scope.getProvinceDestination = function () {

    };

    /**
     * Upload hình ảnh và lưu vào biến transportTypeImg
     * @param file
     */
    $scope.uploadTourDetailImg = function (file) {
        if (file && !file.$error) {
            $scope.tourDetail.tourDetailImage = file;
        }
    };

    /**
     * Hàm kiểm tra sự trùng lặp giữa điểm đi và điểm đến
     * @returns {boolean}
     */
    function hasDuplicateSelection() {
        return $scope.tourDetail.fromLocation === $scope.tourDetail.toLocation;
    }

    /**
     * Hàm kiểm tra sự trùng lặp giữa điểm đi và điểm đến
     */
    $scope.updateToLocation = function () {
        if (hasDuplicateSelection()) {
            $scope.tourDetail.toLocation = null;
            $scope.toLocationError = true;
        } else {
            $scope.toLocationError = false;
        }

        $scope.filteredProvinces = $scope.provinces.filter(function (city) {
            return city.Name !== $scope.tourDetail.fromLocation;
        });
    };

    // Hàm kiểm tra ngày bắt đầu có hợp lệ
    $scope.isStartDateValid = function () {
        if ($scope.tourDetail.departureDate && $scope.tourDetail.arrivalDate) {
            return new Date($scope.tourDetail.departureDate) <= new Date($scope.tourDetail.arrivalDate);
        }
        return true; // Mặc định là hợp lệ nếu một trong hai ngày không được chọn
    };

    $scope.isEndDateValid = function () {
        if ($scope.tourDetail.arrivalDate && $scope.tourDetail.departureDate) {
            return new Date($scope.tourDetail.arrivalDate) >= new Date($scope.tourDetail.departureDate);
        }
        return true; // Mặc định là hợp lệ nếu một trong hai ngày không được chọn
    };


    $scope.isNumberOfGuestsValid = function () {
        return $scope.tourDetail.numberOfGuests >= 16 && $scope.tourDetail.numberOfGuests <= 50; // Số lượng khách phải lớn hơn 0
    };

    $scope.MinimumNumberOfGuestsValid = function () {
        return $scope.tourDetail.minimumNumberOfGuests >= 1 && $scope.tourDetail.minimumNumberOfGuests <= 16;
    };

    function isPriceValid(price) {
        return price > 0;
    }

    $scope.isPriceValid = function () {
        return isPriceValid($scope.tourDetail.unitPrice);
    }

    $scope.onPriceKeyPress = function (event) {
        let inputValue = event.key;

        if (/^[0-9]+$/.test(inputValue)) {
            return true;
        } else {
            event.preventDefault();
            return false;
        }
    };

    $scope.checkPriceFormat = function () {
        // Kiểm tra xem giá có đúng định dạng số không
        $scope.invalidPriceFormat = !/^[0-9]*$/.test($scope.tourDetail.unitPrice);
    };


    //phân trang
    $scope.setPage = function (page) {
        if (page >= 0 && page < $scope.totalPages) {
            $scope.currentPage = page;
            $scope.getTourDetailList();
        }
    };

    $scope.getPaginationRange = function () {
        var range = [];
        var start, end;

        if ($scope.totalPages <= 3) {
            // Nếu tổng số trang nhỏ hơn hoặc bằng 5, hiển thị tất cả các trang
            start = 0;
            end = $scope.totalPages;
        } else {
            // Hiển thị 2 trang trước và 2 trang sau trang hiện tại
            start = Math.max(0, $scope.currentPage - 1);
            end = Math.min(start + 3, $scope.totalPages);

            // Điều chỉnh để luôn hiển thị 5 trang
            if (end === $scope.totalPages) {
                start = $scope.totalPages - 3;
            }
        }

        for (var i = start; i < end; i++) {
            range.push(i);
        }

        return range;
    };

    $scope.pageSizeChanged = function () {
        $scope.currentPage = 0; // Đặt lại về trang đầu tiên
        $scope.getTourDetailList(); // Tải lại dữ liệu với kích thước trang mới
    };

    $scope.getDisplayRange = function () {
        return Math.min(($scope.currentPage + 1) * $scope.pageSize, $scope.totalElements);
    };

    $scope.getTourDetailList = function () {
        TourDetailsServiceAD.findAllTourDetails($scope.currentPage, $scope.pageSize, $scope.sortBy, $scope.sortDir)
            .then(function (response) {
                if (response.data.data === null || response.data.data.content.length === 0) {
                    $scope.setPage(Math.max(0, $scope.currentPage - 1));
                    return
                }
                $scope.tourDetailList = response.data.data.content;
                $scope.totalPages = Math.ceil(response.data.data.totalElements / $scope.pageSize);
                $scope.totalElements = response.data.data.totalElements; // Tổng số phần tử
            }, errorCallback).finally(function () {
            $scope.isLoading = false;
        });

        if (tourDetailId !== undefined && tourDetailId !== null && tourDetailId !== "") {
            TourDetailsServiceAD.findTourDetailById(tourDetailId).then(response => {
                if (response.status === 200) {
                    $timeout(function () {
                        $scope.tourDetail = response.data.data;
                        $scope.tourDetail.departureDate = new Date(response.data.data.departureDate);
                        $scope.tourDetail.arrivalDate = new Date(response.data.data.arrivalDate);
                    }, 0);
                }
            }, errorCallback);
        }
    };

    //sắp xếp
    $scope.sortData = function (column) {
        $scope.sortBy = column;
        $scope.sortDir = ($scope.sortDir === 'asc') ? 'desc' : 'asc';
        $scope.getTourDetailList();
    };

    $scope.getSortIcon = function (column) {
        if ($scope.sortBy === column) {
            if ($scope.sortDir === 'asc') {
                return $sce.trustAsHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M182.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8H288c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-128-128z"/></svg>');
            } else {
                return $sce.trustAsHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M182.6 470.6c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-9.2-9.2-11.9-22.9-6.9-34.9s16.6-19.8 29.6-19.8H288c12.9 0 24.6 7.8 29.6 19.8s2.2 25.7-6.9 34.9l-128 128z"/></svg>');
            }
        }
        return $sce.trustAsHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M137.4 41.4c12.5-12.5 32.8-12.5 45.3 0l128 128c9.2 9.2 11.9 22.9 6.9 34.9s-16.6 19.8-29.6 19.8H32c-12.9 0-24.6-7.8-29.6-19.8s-2.2-25.7 6.9-34.9l128-128zm0 429.3l-128-128c-9.2-9.2-11.9-22.9-6.9-34.9s16.6-19.8 29.6-19.8H288c12.9 0 24.6 7.8 29.6 19.8s2.2 25.7-6.9 34.9l-128 128c-12.5 12.5-32.8 12.5-45.3 0z"/></svg>');
    };


    //tìm kiếm
    $scope.searchTourDetail = function () {
        if (searchTimeout) $timeout.cancel(searchTimeout);

        searchTimeout = $timeout(function () {
            TourDetailsServiceAD.findAllTourDetails($scope.currentPage, $scope.pageSize, $scope.sortBy, $scope.sortDir, $scope.searchTerm)
                .then(function (response) {
                    $scope.tourDetailList = response.data.data.content;
                    $scope.totalPages = Math.ceil(response.data.data.totalElements / $scope.pageSize);
                    $scope.totalElements = response.data.data.totalElements;
                }, errorCallback);
        }, 500); // 500ms debounce
    };

    $scope.getTourDetailList();

    /*==============================================================================*/

    //fill form input
    $scope.loadTourDetailForm = function () {
        ToursServiceAD.findAllToursSelect().then(function (response) {
            $scope.tourBasicList = response.data.data;
        }, errorCallback);

        AccountServiceAD.findUsersByRolesIsGuild().then(function successCallback(response) {
            $scope.UsersByRolesIsGuildSelect = response.data.data;
        }, errorCallback);

        $http.get('/lib/address/data.json').then(function (response) {
            $scope.provinces = response.data;
        }, errorCallback);

        $scope.onProvinceChange = function (locationType) {
            let selectedProvince = $scope.provinces.find(p => p.Id === $scope.tourDetail[locationType]);
            if (selectedProvince) {
                $scope.tourDetail[locationType] = selectedProvince.Name;
            }
        };

    };

    $scope.loadTourDetailForm()

    //form create

    $scope.loadSelectTourType = function () {
        ToursTypeServiceAD.getAllTourTypes()
            .then(function (response) {
                $scope.tourTypeList = response.data;
            }, errorCallback);
    };

    // Gọi hàm để tải danh sách tourType khi controller được khởi tạo
    // $scope.loadSelectTourType();

    $scope.createTourDetailSubmit = () => {
        $scope.isLoading = true;
        let tourDetail = $scope.tourDetail;
        let tourDetailImage = $scope.tourDetail.tourDetailImage;

        const dataTourDetail = new FormData();

        dataTourDetail.append("tourDetailsDto", new Blob([JSON.stringify(tourDetail)], {type: "application/json"}));
        angular.forEach(tourDetailImage, function (file) {
            dataTourDetail.append('tourDetailImage', file);
        });

        TourDetailsServiceAD.createTourDetail(dataTourDetail).then(function successCallback() {
            toastAlert('success', 'Thêm mới thành công !');
            $location.path('/admin/detail-tour-list');
        }, errorCallback).finally(function () {
            $scope.isLoading = false;
        });
    };

    //form update
    function confirmUpdate() {
        const dataTourDetail = new FormData();
        $scope.isLoading = true;

        dataTourDetail.append("tourDetailsDto", new Blob([JSON.stringify($scope.tourDetail)], {type: "application/json"}));

        TourDetailsServiceAD.updateTourDetail(tourDetailId, dataTourDetail).then(function successCallback() {
            toastAlert('success', 'Cập nhật thành công !');
            $location.path('/admin/detail-tour-list');
        }, errorCallback).finally(function () {
            $scope.isLoading = false;
        });
    }

    $scope.updateTourDetail = function () {
        confirmAlert('Bạn có chắc chắn muốn cập nhật không ?', confirmUpdate);
    }

    //delete
    /**
     * Gọi api delete tour
     */
    $scope.deleteTourDetail = function (tourDetailId) {
        function confirmDeleteTour() {
            TourDetailsServiceAD.deactivateTourDetail(tourDetailId).then(function successCallback() {
                toastAlert('success', 'Xóa tour thành công !');
                $('#modal-tour-detail').modal('hide');
                $scope.getTourDetailList();
            }, errorCallback);
        }

        confirmAlert('Bạn có chắc chắn muốn xóa tour ' + tourDetailId + ' không ?', confirmDeleteTour);
    }
});
