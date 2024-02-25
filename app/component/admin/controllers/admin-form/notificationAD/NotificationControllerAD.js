travel_app.controller('NotificationControllerAD', function ($scope, $http, $location, $sce, $rootScope, $routeParams, $timeout, NotificationsServiceAD, AgencyServiceAD) {

    $scope.maxVisibleNotifications = 5;
    $scope.visibleNotifications = [];

    function errorCallback() {
        $location.path('/admin/internal-server-error')
    }

    $scope.init = function () {
        $scope.isLoading = true;

        NotificationsServiceAD.findAllNote().then(function successCallback(response) {
            $scope.showNotification = false;
            $scope.allNotification = response.data.data;

            for (let i = 0; i < $scope.allNotification.length; i++) {
                if ($scope.allNotification[i].isSeen === false) {
                    $scope.showNotification = true;
                }
            }
            $scope.updateVisibleNotifications();
        }, errorCallback).finally(function () {
            $scope.isLoading = false;
        });
    }

    setInterval(function () {
        $scope.init();
    }, 3000);

    $scope.init();

    $scope.showMore = function (event) {
        $scope.maxVisibleNotifications += 10;
        $scope.updateVisibleNotifications();
        event.stopPropagation();
        //$scope.$apply();
    };

    $scope.hideMore = function (event) {
        $scope.maxVisibleNotifications = 5;
        $scope.updateVisibleNotifications();
        event.stopPropagation();
    };

    $scope.updateVisibleNotifications = function () {
        $scope.visibleNotifications = $scope.allNotification.slice(0, $scope.maxVisibleNotifications);
    };

    $scope.seenNotification = function (id) {
        $scope.isLoading = true;
        NotificationsServiceAD.seenNote(id).then(function successCallback(response) {
            $scope.loadData();
        }, errorCallback).finally(function () {
            $scope.isLoading = false;
        });
    }

    $scope.seenNotificationAndGo = function (id) {
        $scope.isLoading = true;
        NotificationsServiceAD.seenNote(id).then(function successCallback(response) {
            $scope.loadData();
            $location.path('/admin/agency/agency-list-check');
        }, errorCallback).finally(function () {
            $scope.isLoading = false;
        });
    }

    $scope.deleteNotification = function (id) {
        $scope.isLoading = true;
        NotificationsServiceAD.deleteNote(id).then(function successCallback(response) {
            $scope.loadData();
        }, errorCallback).finally(function () {
            $scope.isLoading = false;
        });
    }

    $scope.loadData = function () {
        $scope.isLoading = true;
        NotificationsServiceAD.findAllNote().then(function successCallback(response) {
            $scope.showNotification = false;
            $scope.allNotification = response.data.data;

            for (let i = 0; i < $scope.allNotification.length; i++) {
                if ($scope.allNotification[i].isSeen === false) {
                    $scope.showNotification = true;
                    break;
                }
            }
            $scope.updateVisibleNotifications();
        }, errorCallback).finally(function () {
            $scope.isLoading = false;
        });

    }
});