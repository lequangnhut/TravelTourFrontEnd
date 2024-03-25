travel_app.controller('VisitInformationControllerAD', function ($scope, $sce, $location, $routeParams, $timeout, VisitInformationServiceAD, TourDetailsServiceAD) {
    $scope.isLoading = true;

    let searchTimeout;

    $scope.bookingTourVisitList = [];
    $scope.currentPage = 0;
    $scope.pageSize = 5;

    const errorCallback = () => {
        $location.path('/admin/internal-server-error')
    }

    //phân trang
    $scope.setPage = (page) => {
        if (page >= 0 && page < $scope.totalPages) {
            $scope.currentPage = page;
            $scope.getBookingTourVisitList();
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
        $scope.getBookingTourVisitList();
    };

    $scope.getDisplayRange = () => {
        return Math.min(($scope.currentPage + 1) * $scope.pageSize, $scope.totalElements);
    };

    const bookingTourVisitData = (response) => {
        $scope.bookingTourVisitList = response.data.data !== null ? response.data.data.content : [];
        $scope.totalPages = response.data.data !== null ? Math.ceil(response.data.data.totalElements / $scope.pageSize) : 0;
        $scope.totalElements = response.data.data !== null ? response.data.data.totalElements : 0;
    };

    $scope.getBookingTourVisitList = () => {
        $scope.isLoading = true;
        VisitInformationServiceAD.getAllByInfo($scope.currentPage, $scope.pageSize, $scope.sortBy, $scope.sortDir, $scope.tourDetailId, $scope.orderVisitStatus, $scope.searchTerm)
            .then((response) => {
                bookingTourVisitData(response);
            }, errorCallback).finally(() => {
            $scope.isLoading = false;
        });
    };

    //sắp xếp
    $scope.sortData = (column) => {
        $scope.sortBy = column;
        $scope.sortDir = ($scope.sortDir === 'asc') ? 'desc' : 'asc';
        $scope.getBookingTourVisitList();
    };

    $scope.getSortIcon = (column) => {
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
    $scope.searchBookingTour = () => {
        if (searchTimeout) $timeout.cancel(searchTimeout);

        searchTimeout = $timeout(() => {
            VisitInformationServiceAD.getAllByInfo($scope.currentPage, $scope.pageSize, $scope.sortBy, $scope.sortDir, $scope.tourDetailId, $scope.orderVisitStatus, $scope.searchTerm)
                .then((response) => {
                    bookingTourVisitData(response);
                }, errorCallback);
        }, 500);
    };

    $scope.orderVisitChanged = () => {
        $scope.getBookingTourVisitList();
    };

    $scope.deactivateBookingTourVisit = (visitId) => {
        const confirm = () => {
            VisitInformationServiceAD.deactivate($scope.tourDetailId, visitId, $scope.orderVisitStatus).then(() => {
                toastAlert('success', 'Hủy thành công !');
                $scope.closeModal();
                $scope.getBookingTourVisitList();
            }, errorCallback);
        }

        confirmAlert('Bạn có chắc chắn muốn hủy đơn này không ?', confirm);
    }

    $scope.restoreBookingTourVisit = (visitId) => {
        const confirm = () => {
            VisitInformationServiceAD.restore($scope.tourDetailId, visitId, $scope.orderVisitStatus).then(() => {
                toastAlert('success', 'Khôi phục thành công !');
                $scope.closeModal();
                $scope.getBookingTourVisitList();
            }, errorCallback);
        }

        confirmAlert('Bạn có chắc chắn muốn khôi phục đơn này không ?', confirm);
    }

    $scope.getBookingTourVisitList();

    /**
     * Phương thức mở modal
     */
    $scope.openModal = (visit) => {
        $('#modal-order-visit').modal('show');

        $scope.visit = visit;
        if (!$scope.tourDetailId && !visit.id) return;

        VisitInformationServiceAD.getAllByTourDetailIdAndVisitId($scope.tourDetailId, visit.id, $scope.orderVisitStatus)
            .then(response => {
                if (response.status === 200) {
                    $scope.orderVisitDetailList = response.data.data;

                    let orderCustomer = $scope.orderVisitDetailList[0].orderVisitsByOrderVisitId;

                    $scope.tourGuide = {
                        customerName: orderCustomer.customerName,
                        customerEmail: orderCustomer.customerEmail,
                        customerPhone: orderCustomer.customerPhone,
                        paymentMethod: orderCustomer.paymentMethod,
                        orderStatus: orderCustomer.orderStatus
                    };
                }
            }, errorCallback);
    }

    $scope.openModalPay = () => {
        $scope.closeModal()
        $('#modal-pay').modal('show');
    }

    /**
     * Phương thức đóng modal
     */
    $scope.closeModal = () => {
        $('#modal-order-visit').modal('hide');
    };

    $scope.closeModalPay = () => {
        $('#modal-pay').modal('hide');
    };


    $scope.selectTourDetailId = () => {
        $scope.isLoading = true;
        TourDetailsServiceAD.findAllTourDetails().then((response) => {
            $scope.tourDetails = response.data.data.content
        }, errorCallback).finally(() => {
            $scope.isLoading = false;
        });
    }

    $scope.selectTourDetailId()

});