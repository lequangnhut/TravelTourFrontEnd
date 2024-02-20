travel_app.controller('RoomTypeControllerAD',
    function ($scope, $sce, $routeParams, $location, $timeout, $http, HotelServiceServiceAD,
              TourDetailsServiceAD, ToursServiceAD, TourTripsServiceAD, HotelTypeServiceServiceAD,
              RoomTypeServiceServiceAD) {
        $scope.isLoading = true;

        const tourDetailId = $routeParams.tourDetailId;
        const hotelId = $routeParams.hotelId;
        $scope.tourDetailId = tourDetailId;

        $scope.tourInfo = {
            tourName: null,
            departureDate: null,
            arrivalDate: null,
            fromLocation: null,
            toLocation: null,
            numberOfGuests: null
        };

        let searchTimeout;

        $scope.roomTypeList = [];
        $scope.currentPage = 0;
        $scope.pageSize = 5;

        $scope.setPage = (page) => {
            if (page >= 0 && page < $scope.totalPages) {
                $scope.currentPage = page;
                $scope.getRoomTypeList();
            }
        };

        $scope.getPaginationRange = () => {
            let range = [];
            let start, end;

            if ($scope.totalPages <= 3) {
                start = 0;
                end = $scope.totalPages;
            } else {
                start = Math.max(0, $scope.currentPage - 1);
                end = Math.min(start + 3, $scope.totalPages);

                if (end === $scope.totalPages) {
                    start = $scope.totalPages - 3;
                }
            }

            for (let i = start; i < end; i++) {
                range.push(i);
            }

            return range;
        };

        $scope.pageSizeChanged = () => {
            $scope.currentPage = 0;
            $timeout(() => {
                $scope.getRoomTypeList();
            }, 0);
        };

        $scope.getDisplayRange = () => Math.min(($scope.currentPage + 1) * $scope.pageSize, $scope.totalElements);

        $scope.roomTypeData = async (response) => {
            let roomTypeList = response.data.data.content;
            $scope.totalPages = Math.ceil(response.data.data.totalElements / $scope.pageSize);
            $scope.totalElements = response.data.data.totalElements;

            const roomTypePromises = roomTypeList.map(async (rt) => {

                const bedTypes = await RoomTypeServiceServiceAD.findBedTypeNameByRoomTypeId(rt.id);
                return {
                    ...rt,
                    roomUtilitiesNames: rt.roomUtilities.map(u => u.roomUtilitiesName).join(", "),
                    bedTypeNames: bedTypes.data.data.map(b => b).join(", "),
                    isChecked: false
                };

            });

            $scope.roomTypeList = await Promise.all(roomTypePromises);
            $scope.$apply()
        };


        $scope.getRoomTypeList = async () => {
            try {
                $scope.isLoading = true;
                const [RoomTypeByHotelByIdResponse, tourDetailResponse] = await Promise.all([
                    RoomTypeServiceServiceAD.getAllOrSearchRoomTypeByHotelId($scope.currentPage, $scope.pageSize, $scope.sortBy, $scope.sortDir, hotelId),
                    TourDetailsServiceAD.findTourDetailById(tourDetailId)
                ]);

                if (!RoomTypeByHotelByIdResponse.data.data || RoomTypeByHotelByIdResponse.data.data.content.length === 0) {
                    $scope.setPage(Math.max(0, $scope.currentPage - 1));
                    return;
                }

                $scope.roomTypeData(RoomTypeByHotelByIdResponse);

                //fill modal tour info and tour trips
                let tourDetail = tourDetailResponse.data.data;
                const tourResponse = await ToursServiceAD.findTourById(tourDetail.tourId);
                const tourTripsResponse = await TourTripsServiceAD.getTripsByTourId(tourDetail.tourId);

                $scope.tourInfo = {
                    tourName: tourResponse.data.tourName,
                    departureDate: new Date(tourDetail.departureDate),
                    arrivalDate: new Date(tourDetail.arrivalDate),
                    fromLocation: tourDetail.fromLocation,
                    toLocation: tourDetail.toLocation,
                    numberOfGuests: tourDetail.numberOfGuests
                };

                let tourTripsList = tourTripsResponse.data.data;

                tourTripsList.forEach(function (tourTrips) {
                    tourTrips.activityInDay = $sce.trustAsHtml(tourTrips.activityInDay);
                });

                $scope.tourTripsList = tourTripsList;


                //fill modal hotelInfo
                const HotelByIdResponse = await HotelServiceServiceAD.findHotelById(hotelId)
                const hotel = HotelByIdResponse.data.data;

                const HotelTypeByIdResponse = await HotelTypeServiceServiceAD.findById(hotel.hotelTypeId)
                const hotelType = HotelTypeByIdResponse.data.data;

                const placeUtilitiesNames = hotel.placeUtilities.map(util => util.placeUtilitiesName).join(" - ");

                $scope.hotelInfo = {
                    hotelName: hotel.hotelName,
                    hotelTypeName: hotelType.hotelTypeName,
                    address: `${hotel.address} - ${hotel.ward} - ${hotel.district} - ${hotel.province}`,
                    utilities: placeUtilitiesNames,
                };

            } catch (error) {
                console.error("Error:", error);
            } finally {
                $scope.$apply(() => {
                    $scope.isLoading = false;
                });
            }
        }

        const getColumnValue = (item, field) => {
            // Logic hiện tại của bạn đã phù hợp cho việc lấy giá trị
            switch (field) {
                case 'roomUtilitiesNames':
                    return item.roomUtilitiesNames.toLowerCase(); // Đảm bảo so sánh không phân biệt hoa thường
                case 'bedTypeNames':
                    return item.bedTypeNames.toLowerCase(); // Đảm bảo so sánh không phân biệt hoa thường
                default:
                    return item[field];
            }
        };


        $scope.customSort = function (field, dir) {
            const sortDirection = dir === 'asc' ? 1 : -1;

            $scope.roomTypeList.sort((a, b) => {
                const aValue = getColumnValue(a, field);
                const bValue = getColumnValue(b, field);

                // Áp dụng so sánh chuỗi cho roomUtilitiesNames và bedTypeNames
                if (field === 'roomUtilitiesNames' || field === 'bedTypeNames') {
                    return aValue.localeCompare(bValue) * sortDirection;
                } else {
                    // So sánh giá trị số hoặc các loại giá trị khác
                    if (aValue > bValue) return sortDirection;
                    if (aValue < bValue) return -sortDirection;
                    return 0;
                }
            });

            $scope.sortDir = dir;
        };

        $scope.sortData = (column) => {
            if (column === 'roomUtilitiesNames' || column === 'bedTypeNames') {
                $scope.sortBy = column;
                $scope.sortDir = ($scope.sortDir === 'asc') ? 'desc' : 'asc';
                $scope.customSort(column, $scope.sortDir);
            } else {
                $scope.sortBy = column;
                $scope.sortDir = ($scope.sortDir === 'asc') ? 'desc' : 'asc';
                $scope.getRoomTypeList();
            }
        };

        $scope.getSortIcon = (column) => {
            if ($scope.sortBy === column) {
                return $sce.trustAsHtml($scope.sortDir === 'asc' ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M182.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8H288c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-128-128z"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M182.6 470.6c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-9.2-9.2-11.9-22.9-6.9-34.9s16.6-19.8 29.6-19.8H288c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l-128 128z"/></svg>');
            }
            return $sce.trustAsHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M137.4 41.4c12.5-12.5 32.8-12.5 45.3 0l128 128c9.2 9.2 11.9 22.9 6.9 34.9s-16.6 19.8-29.6 19.8H32c-12.9 0-24.6-7.8-29.6-19.8s-2.2-25.7 6.9-34.9l128-128zm0 429.3l-128-128c-9.2-9.2-11.9-22.9-6.9-34.9s16.6-19.8 29.6-19.8H288c12.9 0 24.6 7.8 29.6 19.8s2.2 25.7-6.9 34.9l-128 128c-12.5 12.5-32.8 12.5-45.3 0z"/></svg>');
        };

        $scope.searchRoomType = async () => {
            if (searchTimeout) $timeout.cancel(searchTimeout);

            searchTimeout = $timeout(async () => {
                try {
                    const response = await RoomTypeServiceServiceAD.getAllOrSearchRoomTypeByHotelId($scope.currentPage, $scope.pageSize, $scope.sortBy, $scope.sortDir, hotelId, $scope.searchTerm);

                    if (!response || !response.data || !response.data.data || !response.data.data.content) {
                        $scope.getRoomTypeList();
                        toastAlert('warning', 'Không tìm thấy !');
                        return;
                    }

                    $scope.roomTypeData(response)
                } catch (error) {
                    console.error("Error:", error);
                }

            }, 500);
        };

        $scope.getRoomTypeList();

    });