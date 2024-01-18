travel_app.controller('AccountControllerAD', function ($scope, $location, $routeParams, AccountServiceAD, AuthService) {
    $scope.selectedRoles = [];

    $scope.currentPage = 0;

    $scope.emailError = false;
    $scope.phoneError = false;
    $scope.cardError = false;

    $scope.admin = {
        email: null,
        password: null,
        cpsw: null,
        fullName: null,
        address: null,
        citizenCard: null,
        phone: null,
        isActive: null
    }

    let userId = $routeParams.id;

    function errorCallback(error) {
        console.log(error)
        toastAlert('error', "Máy chủ không tồn tại !");
    }

    /**
     * @message Check duplicate email
     */
    $scope.checkDuplicateEmail = function () {
        AuthService.checkExistEmail($scope.admin.email).then(function successCallback(response) {
            $scope.emailError = response.data.exists;
        });
    };

    /**
     * @message Check duplicate phone
     */
    $scope.checkDuplicatePhone = function () {
        AuthService.checkExistPhone($scope.admin.phone).then(function successCallback(response) {
            $scope.phoneError = response.data.exists;
        });
    };

    /**
     * @message Check duplicate card
     */
    $scope.checkDuplicateCard = function () {
        AuthService.checkExistCard($scope.admin.citizenCard).then(function successCallback(response) {
            $scope.cardError = response.data.exists;
        });
    };

    /**
     * @message Chọn role lưu vào mảng selectedRoles
     */
    $scope.toggleRole = function (role) {
        var index = $scope.selectedRoles.indexOf(role);

        if (index === -1) {
            $scope.selectedRoles.push(role);
        } else {
            $scope.selectedRoles.splice(index, 1);
        }
    };

    /**
     * Gọi api show dữ liệu lên bảng của staff và agent
     */
    $scope.init = function () {
        AccountServiceAD.findAllAccountStaff($scope.currentPage).then(function successCallback(response) {
            if (response.status === 200) {
                $scope.listAccountStaff = response.data.content;
                $scope.totalPages = response.data.totalPages;
            }
        }, errorCallback);

        AccountServiceAD.findAllAccountAgent($scope.currentPage).then(function successCallback(response) {
            if (response.status === 200) {
                $scope.listAccountAgent = response.data.content;
                $scope.totalPages = response.data.totalPages;
            }
        }, errorCallback);

        if (userId !== undefined && userId !== null && userId !== "") {
            AccountServiceAD.findById(userId).then(function successCallback(response) {
                if (response.status === 200) {
                    $scope.admin = response.data;
                }
            }, errorCallback);
        }
    }

    $scope.loadPage = function (page) {
        $scope.currentPage = page;
        $scope.init();
    };

    /**
     * Gọi api tạo mới account
     */
    $scope.createAccount = function (url) {
        let dataAccount = {
            accountDto: $scope.admin,
            roles: $scope.selectedRoles
        }
        AccountServiceAD.create(dataAccount).then(function successCallback() {
            toastAlert('success', 'Thêm mới thành công !');
            $location.path('/admin/' + url + '-management');
        }, errorCallback);
    }

    /**
     * Gọi api cập nhật account staff
     */
    function confirmUpdateStaff() {
        AccountServiceAD.update($scope.admin).then(function successCallback() {
            toastAlert('success', 'Cập nhật thành công !');
            $location.path('/admin/account-management');
        }, errorCallback);
    }

    $scope.updateAccountStaff = function () {
        confirmAlert('Bạn có chắc chắn muốn cập nhật không ?', confirmUpdateStaff);
    }

    /**
     * Gọi api cập nhật account agent
     */
    function confirmUpdateAgent() {
        AccountServiceAD.update($scope.admin).then(function successCallback() {
            toastAlert('success', 'Cập nhật thành công !');
            $location.path('/admin/agent-management');
        }, errorCallback);
    }

    $scope.updateAccountAgent = function () {
        confirmAlert('Bạn có chắc chắn muốn cập nhật không ?', confirmUpdateAgent);
    }

    /**
     * Gọi api delete account
     */
    $scope.deleteAccount = function (userId, fullName, url) {
        function confirmDeleteStaff() {
            AccountServiceAD.delete(userId).then(function successCallback() {
                toastAlert('success', 'Xóa tài khoản thành công !');
                $location.path('/admin/' + url + '-management');
                $scope.init();
            }, errorCallback);
        }

        confirmAlert('Bạn có chắc chắn muốn xóa nhân viên ' + fullName + ' không ?', confirmDeleteStaff);
    }

    $scope.init();
});