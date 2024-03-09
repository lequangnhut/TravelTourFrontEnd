travel_app.controller('TourDetailCusController',
    function ($scope, $location, $sce, $routeParams, LocalStorageService, TourTripsServiceAD, TourDetailsServiceAD, TourDetailCusService, MapBoxService) {
        mapboxgl.accessToken = 'pk.eyJ1IjoicW5odXQxNyIsImEiOiJjbHN5aXk2czMwY2RxMmtwMjMxcGE1NXg4In0.iUd6-sHYnKnhsvvFuuB_bA';

        $scope.markerTrips = [];
        $scope.coordinateTrips = [];

        $scope.provinceData = [];

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
            bookedSeat: null,
            fromLocation: null,
            toLocation: null,
            tourDetailImage: null
        };

        $scope.ticket = {
            adults: '1',
            children: '0',
            baby: '0'
        }

        const tourDetailId = $routeParams.id;

        function errorCallback() {
            $location.path('/admin/internal-server-error')
        }

        $scope.init = function () {
            $scope.isLoading = true;

            $scope.changeTab = function (tabName) {
                $scope.$broadcast('tabChanged', {tabName: tabName});
            };

            TourDetailCusService.findByTourDetailId(tourDetailId).then(function (response) {
                if (response.status === 200) {
                    $scope.tourDetail = response.data.data;
                    $scope.tourDetailImagesById = response.data.data.tourDetailImagesById;
                    $scope.tourDetailDescription = $sce.trustAsHtml($scope.tourDetail.tourDetailDescription);

                    let departureDate = new Date($scope.tourDetail.departureDate);
                    let arrivalDate = new Date($scope.tourDetail.arrivalDate);

                    $scope.tourDetail.numberOfDays = Math.ceil((arrivalDate - departureDate) / (1000 * 60 * 60 * 24));

                    $scope.initMapSchedules();
                    $scope.updateTotalPrice();
                } else {
                    $location.path('/admin/page-not-found')
                }
            }, errorCallback).finally(function () {
                $scope.isLoading = false;
            });

            TourDetailCusService.findAllTourTrend().then(function (response) {
                if (response.status === 200) {
                    $scope.tourTrendData = response.data.data.map(function (item) {
                        return {
                            tourId: item[0],
                            tourName: item[1],
                            tourImg: item[2],
                            unitPrice: item[3],
                            tourDetailCount: item[4]
                        };
                    });
                } else {
                    $location.path('/admin/page-not-found')
                }
            }, errorCallback).finally(function () {
                $scope.isLoading = false;
            });

            /**
             * phương thức update giá khi người dùng chọn số lượng
             */
            $scope.updateTotalPrice = function () {
                let unitPrice = $scope.tourDetail.unitPrice;
                let amountAdults = $scope.ticket.adults;
                let amountChildren = $scope.ticket.children;

                $scope.totalPrice = (amountAdults * unitPrice) + (amountChildren * (unitPrice * 0.3));
                $scope.totalTikets = parseInt($scope.ticket.adults) + parseInt($scope.ticket.children) + parseInt($scope.ticket.baby);
                $scope.isExceedGuestLimit();
            };

            /**
             * phương thức kiểm tra vé
             * @returns {boolean}
             */
            $scope.isExceedGuestLimit = function () {
                let numberOfGuest = $scope.tourDetail.numberOfGuests;
                let bookSeat = $scope.tourDetail.bookedSeat;
                let totalAmountTicket = parseInt($scope.ticket.adults) + parseInt($scope.ticket.children) + parseInt($scope.ticket.baby);

                return totalAmountTicket + bookSeat + 1 > numberOfGuest;
            }

            /**
             * phương thức khởi tạo bản đồ
             */
            $scope.initMapTrips = function () {
                $scope.mapTrips = new mapboxgl.Map({
                    container: 'map-trips',
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: [106.6297, 10.8231],
                    zoom: 9
                });
            }

            /**
             * phương lấy tất cả tour trip ra theo ngày 1
             */
            TourTripsServiceAD.getTripsByTourId(tourDetailId).then(function (response) {
                if (response.status === 200) {
                    $scope.tourTrips = response.data.data.tourTrips;
                    $scope.dayInTrip = response.data.data.dayInTrip.map(function (item) {
                        return {
                            dayTrip: item
                        };
                    });

                    $scope.initMapTrips();
                    $scope.createMarkerTrips($scope.tourTrips);
                } else {
                    $location.path('/admin/page-not-found')
                }
            }, errorCallback).finally(function () {
                $scope.isLoading = false;
            });

            /**
             * phương thức thay đổi ngày và điểm đi trên bản đồ
             * @param dayInTrip
             */
            $scope.changeLocationOnMap = function (dayInTrip) {
                TourTripsServiceAD.findTripsByDayInTrip(dayInTrip).then(function (response) {
                    if (response.status === 200) {
                        $scope.tourTrips = response.data.data;

                        $scope.initMapTrips();
                        $scope.createMarkerTrips($scope.tourTrips);
                    } else {
                        $location.path('/admin/page-not-found')
                    }
                }, errorCallback).finally(function () {
                    $scope.isLoading = false;
                });
            }

            /**
             * phương thức zoom vị trí trên bản đồ
             * @param placeAddress
             */
            $scope.zoomLocation = function (placeAddress) {
                let bounds = new mapboxgl.LngLatBounds();

                let element = document.getElementById('map-trips');
                if (element) {
                    element.scrollIntoView({behavior: 'smooth', block: 'center'});
                }

                MapBoxService.geocodeAddress(placeAddress, function (error, placeAddressCoordinates) {
                    if (!error) {
                        bounds.extend(placeAddressCoordinates);
                        $scope.mapTrips.fitBounds(bounds, {padding: 20});
                    }
                });
            }

            /**
             * Phương thức thêm marker tour trip trên bản đồ
             */
            $scope.createMarkerTrips = function (tourTrips) {
                $scope.removeMarkerTrips();
                let bounds = new mapboxgl.LngLatBounds();

                let count = 1;

                for (const trip of tourTrips) {
                    let placeAddress = trip.placeAddress;
                    let placeImage = trip.placeImage;

                    let elMarkerNot = document.createElement('a');
                    elMarkerNot.className = 'markerNot';
                    elMarkerNot.href = `SCROLL_${trip.id}`
                    elMarkerNot.style.backgroundImage = `url(${placeImage})`;
                    elMarkerNot.style.width = '50px';
                    elMarkerNot.style.height = '50px';
                    elMarkerNot.style.borderRadius = '50%';
                    elMarkerNot.style.backgroundSize = '100%';
                    elMarkerNot.style.border = '3px solid #ff9800';

                    elMarkerNot.addEventListener('click', function (event) {
                        event.preventDefault();

                        let tripId = this.getAttribute('href');
                        let element = document.getElementById(tripId);
                        if (element) {
                            element.scrollIntoView({behavior: 'smooth', block: 'center'});
                        }
                    });

                    let elMarkerTrip = document.createElement('div');
                    elMarkerTrip.className = 'markerTrip';
                    elMarkerTrip.style.position = 'relative';
                    elMarkerTrip.style.width = '20px';
                    elMarkerTrip.style.height = '20px';
                    elMarkerTrip.style.top = '-10px';
                    elMarkerTrip.style.right = '-30px';
                    elMarkerTrip.style.borderRadius = '50%';
                    elMarkerTrip.style.background = '#ff9800';
                    elMarkerTrip.style.textAlign = 'center';
                    elMarkerTrip.style.color = 'white';
                    elMarkerTrip.innerText = `${count}`;
                    elMarkerNot.appendChild(elMarkerTrip);

                    count++;

                    MapBoxService.geocodeAddress(placeAddress, function (error, placeAddressCoordinates) {
                        if (!error) {
                            let marker = new mapboxgl.Marker(elMarkerNot)
                                .setLngLat(placeAddressCoordinates)
                                .addTo($scope.mapTrips);

                            $scope.markerTrips.push(marker);
                            $scope.coordinateTrips.push(placeAddressCoordinates);

                            bounds.extend(placeAddressCoordinates);
                            $scope.mapTrips.fitBounds(bounds, {padding: 20});
                        }
                    });
                }

                $scope.mapTrips.on('style.load', function () {
                    let waypoints = ''; // Chuỗi để lưu trữ các tọa độ trung gian

                    $scope.coordinateTrips.forEach(function (coordinate, index) {
                        waypoints += `${coordinate[0]},${coordinate[1]}`;
                        if (index < $scope.coordinateTrips.length - 1) {
                            waypoints += ';'; // Thêm dấu chấm phẩy giữa các tọa độ, trừ tọa độ cuối cùng
                        }
                    });

                    let routeURL = `https://api.mapbox.com/directions/v5/mapbox/driving/${waypoints}?geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`;

                    fetch(routeURL)
                        .then(response => response.json())
                        .then(data => {
                            // Lấy dữ liệu về đường đi
                            let route = data.routes[0].geometry;

                            $scope.mapTrips.addLayer({
                                'id': 'map-line',
                                'type': 'line',
                                'source': {
                                    'type': 'geojson',
                                    'data': {
                                        'type': 'Feature',
                                        'properties': {},
                                        'geometry': route
                                    }
                                },
                                'layout': {
                                    'line-join': 'round',
                                    'line-cap': 'round'
                                },
                                'paint': {
                                    'line-color': '#e35050',
                                    'line-width': 3
                                }
                            });
                        })
                        .catch(error => {
                            console.error('Lỗi khi lấy thông tin định tuyến:', error);
                        });
                });
            }

            /**
             * Phương thức xóa toàn bộ đường dẫn vẽ trên bản đồ
             */
            $scope.removeMapLayer = function () {
                if ($scope.mapTrips.getLayer('map-line')) {
                    $scope.mapTrips.removeLayer('map-line');
                    $scope.mapTrips.removeSource('map-line');
                } else {
                    console.error('Layer "map-line" does not exist in the map.');
                }
            }


            /**
             * Phương thức xóa marker tour trip trên bản đồ
             */
            $scope.removeMarkerTrips = function () {
                if ($scope.markerTrips.length > 0) {
                    $scope.markerTrips.forEach(function (marker) {
                        marker.remove();
                    });
                    $scope.markerTrips = [];
                }
            };

            /**
             * phương thức gửi booking cho server
             */
            $scope.submitBooking = function () {
                let numberOfGuest = $scope.tourDetail.numberOfGuests;
                let bookSeat = $scope.tourDetail.bookedSeat;
                let totalAmountTicket = parseInt($scope.ticket.adults) + parseInt($scope.ticket.children) + parseInt($scope.ticket.baby);
                let newAmountTicket = totalAmountTicket + bookSeat;

                if (newAmountTicket > numberOfGuest) {
                    centerAlert('Cảnh báo !', 'Số lượng bạn chọn không phù hợp với tour hiện tại ! Vui lòng chọn lại, số lượng còn lại là ' + (numberOfGuest - bookSeat) + ' vé.', 'warning');
                } else {
                    let dataBooking = {
                        ticket: $scope.ticket,
                        totalPrice: $scope.totalPrice,
                        tourDetail: $scope.tourDetail,
                        provinceName: $scope.provinceName
                    }

                    LocalStorageService.set('dataBooking', dataBooking);
                    $location.path('/tours/tour-detail/' + tourDetailId + '/booking-tour');
                }
            }
        }

        /**
         * phương thức khởi tạo bản đồ vẽ lịch trình
         */
        $scope.initMapSchedules = function () {
            $scope.isLoading = true;

            $scope.provinceName = [];

            if (!tourDetailId) return;

            TourDetailsServiceAD.findTourDestinationByTourDetailById(tourDetailId).then(function (response) {
                if (response.status === 200) {
                    $scope.arrayDataProvince = response.data.data;

                    if ($scope.arrayDataProvince !== null) {
                        $scope.arrayDataProvince.forEach(function (item) {
                            $scope.provinceName.push(item.province);
                        });
                    } else {
                        $scope.provinceName = [];
                    }

                    let fromLocation = $scope.tourDetail.fromLocation;
                    let toLocation = $scope.tourDetail.toLocation;
                    let intermediatePoints = $scope.provinceName;

                    // Lấy tọa độ từ tên địa chỉ cho cả điểm đi và điểm đến
                    MapBoxService.geocodeAddress(fromLocation, function (error, fromCoordinates) {
                        if (!error) {
                            MapBoxService.geocodeAddress(toLocation, function (error, toCoordinates) {
                                if (!error) {
                                    if (intermediatePoints.length > 0) {
                                        let coordinatesList = intermediatePoints.map(function (point) {
                                            return new Promise(function (resolve, reject) {
                                                MapBoxService.geocodeAddress(point, function (error, coordinates) {
                                                    if (!error) {
                                                        resolve(coordinates);
                                                    } else {
                                                        reject(error);
                                                    }
                                                });
                                            });
                                        });

                                        Promise.all(coordinatesList)
                                            .then(function (intermediateCoordinates) {
                                                let waypoints = intermediateCoordinates.map(coord => `${coord[0]},${coord[1]}`).join(";");
                                                let routeURL = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromCoordinates[0]},${fromCoordinates[1]};${waypoints};${toCoordinates[0]},${toCoordinates[1]}?geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`;

                                                drawMap(routeURL, fromCoordinates, toCoordinates, intermediateCoordinates);
                                            })
                                            .catch(error => {
                                                console.error('Lỗi khi lấy tọa độ của các điểm trung gian:', error);
                                            });
                                    } else {
                                        let routeURL = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromCoordinates[0]},${fromCoordinates[1]};${toCoordinates[0]},${toCoordinates[1]}?geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`;

                                        drawMap(routeURL, fromCoordinates, toCoordinates, []);
                                    }
                                } else {
                                    console.error("Lỗi khi lấy tọa độ của điểm đi hoặc điểm đến:", error);
                                }
                            });
                        } else {
                            console.error("Lỗi khi lấy tọa độ của điểm đi:", error);
                        }
                    });
                } else {
                    $location.path('/admin/page-not-found')
                }
            }, errorCallback).finally(function () {
                $scope.isLoading = false;
            });
        }

        /**
         * phương thức vẽ lịch trình trên map
         * @param routeURL
         * @param fromCoordinates
         * @param toCoordinates
         * @param intermediateCoordinates
         */
        function drawMap(routeURL, fromCoordinates, toCoordinates, intermediateCoordinates) {
            const map = $scope.map = new mapboxgl.Map({
                container: 'map-schedules',
                style: 'mapbox://styles/mapbox/streets-v12',
                center: toCoordinates,
                zoom: 10
            });

            map.on('load', () => {
                $scope.createMarkerSchedules(fromCoordinates, map, 'start');
                $scope.createMarkerSchedules(toCoordinates, map, 'end');

                if (intermediateCoordinates.length > 0) {
                    intermediateCoordinates.forEach(coord => {
                        $scope.createMarkerSchedules(coord, map, 'waypoint');
                    });
                }

                fetch(routeURL)
                    .then(response => response.json())
                    .then(data => {
                        // Lấy dữ liệu về đường đi
                        let route = data.routes[0].geometry;

                        // Vẽ đường đi trên bản đồ
                        map.addLayer({
                            'id': 'route',
                            'type': 'line',
                            'source': {
                                'type': 'geojson',
                                'data': {
                                    'type': 'Feature',
                                    'properties': {},
                                    'geometry': route
                                }
                            },
                            'layout': {
                                'line-join': 'round',
                                'line-cap': 'round'
                            },
                            'paint': {
                                'line-color': '#e35050',
                                'line-width': 3
                            }
                        });
                    })
                    .catch(error => {
                        console.error('Lỗi khi lấy thông tin định tuyến:', error);
                    });
            });
        }

        /**
         * phương thức tạo marker trên bản đồ
         * @param coordinates
         * @param map
         * @param type
         */
        $scope.createMarkerSchedules = function (coordinates, map, type) {
            let popupContent;
            let tourDetail = $scope.tourDetail;

            if (type === 'start') {
                popupContent = 'Công ty dịch vụ lữ hành TravelTour';
            } else if (type === 'end') {
                popupContent = createPopupContent(tourDetail);
            } else if (type === 'waypoint') {
                popupContent = 'Điểm dừng chân, tham quan';
            } else {
                popupContent = 'Công ty dịch vụ lữ hành TravelTour';
            }

            let iconUrl = '/assets/customers/images/icon/maker.png';
            let el = document.createElement('div');
            el.className = 'marker';
            el.style.backgroundImage = `url(${iconUrl})`;
            el.style.width = '40px';
            el.style.height = '40px';
            el.style.backgroundSize = '100%';

            let popup = new mapboxgl.Popup({
                offset: 15,
                closeButton: true,
                closeOnClick: false,
                closeOnClickOutside: true,
                maxWidth: '800px',
                minWidth: '600px'
            }).setHTML(popupContent);

            new mapboxgl.Marker(el)
                .setLngLat(coordinates)
                .setPopup(popup)
                .addTo(map);

            let closeButton = popup._content.querySelector('.mapboxgl-popup-close-button');
            if (closeButton) {
                closeButton.style.fontSize = '20px';
                closeButton.style.width = '20px';
                closeButton.style.height = '20px';
                closeButton.style.lineHeight = '20px';
            }
        }

        $scope.init();

        function createPopupContent(tourDetail) {
            return `    <div class="m-1 mb-30 row">
                        <div class="img-holder col-xl-3 col-lg-4 p-0">
                            <img src="${tourDetail.toursByTourId.tourImg}" style="height: 170px"
                                 onerror="this.src='/assets/admin/assets/img/bg/default-image-hotel.png'"/>
                        </div>
                        <div class=" col-xl-9 col-lg-8">
                            <div class="meta row">
                                <div class="col-lg-12 ">
                                    <div>
                                        <span>
                                            <i class="fa-solid fa-street-view"></i>
                                            <a class="fw-medium">
                                                ${tourDetail.tourTypes.tourTypeName}
                                            </a>
                                        </span>
                                        <h3 class="fw-medium">
                                            <a href="#">${tourDetail.toursByTourId.tourName}</a>
                                        </h3>
                                        <div class="d-flex align-items-center mb-3"
                                             style="border-bottom: 1px solid rgba(29, 35, 31, 0.1);">
                                            <div class="location text-orange" style="font-size: 14px">
                                                <p>
                                                    <span class="fas fa-map-marker-alt"></span>
                                                    ${tourDetail.fromLocation}
                                                    -
                                                    ${tourDetail.toLocation}
                                                </p>
                                                <p>
                                                    <i class="fa-solid fa-user-tie"></i>
                                                    Đã đặt: ${tourDetail.bookedSeat}/${tourDetail.numberOfGuests} chổ
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="roomTypeByHotel mb-3"
                                         style="padding-left: 10px ;border-left: 1px solid rgba(29, 35, 31, 0.1)">
                                        <div style="font-size: 14px; line-height: 20px">
                                            <p class="fs-7 fw-medium mb-1">Hướng dẫn viên:
                                                ${tourDetail.usersByGuideId.fullName} - ${tourDetail.usersByGuideId.address}
                                            </p>
                                            <p class="fs-7 mb-1">Điểm đi:
                                                <span class="fw-medium">${tourDetail.fromLocation}</span>
                                            </p>
                                            <p class="fs-7 mb-1">Điểm đến:
                                                <span class="fw-medium">${tourDetail.toLocation}</span>
                                            </p>
                                            <div class="text-green">
                                                <i class="fa-solid fa-check"></i> Xe có WIFI miễn phí
                                            </div>
                                            <div class="text-green">
                                                <i class="fa-solid fa-check"></i> Miễn phí nước suối
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
        }

        $scope.$on('$viewContentLoaded', function () {
            $('.place-slider').slick({
                dots: false,
                arrows: false,
                infinite: true,
                speed: 800,
                autoplay: true,
                variableWidth: true,
                slidesToShow: 3,
                slidesToScroll: 1,
                prevArrow: '<div class="prev"><i class="far fa-arrow-left"></i></div>',
                nextArrow: '<div class="next"><i class="far fa-arrow-right"></i></div>',
                responsive: [{
                    breakpoint: 767, settings: {
                        slidesToShow: 1
                    }
                }]
            });
        });
    });