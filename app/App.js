let travel_app = angular.module('travel_app', ['ngRoute']);

let BASE_API = 'http://localhost:8080/api/v1/'

travel_app.config(function ($routeProvider, $locationProvider) {
    $routeProvider
        /**
         * Admin
         */
        .when('/admin', {
            templateUrl: 'app/component/admin/views/pages/auth/login.html',
            controller: 'LoginControllerAD'
        })
        .when('/admin/dashboard', {
            templateUrl: 'app/component/admin/views/pages/dashboard/dashboard.html',
            controller: 'DashboardControllerAD'
        })
        /**
         * Customer
         */
        .when('/home', {
            templateUrl: 'app/component/customers/views/pages/home/home.html',
            controller: 'HomeController'
        })
        .when('/introduce', {
            templateUrl: 'app/component/customers/views/pages/home/introduce.html',
            controller: 'IntroduceController'
        })
        .when('/contact', {
            templateUrl: 'app/component/customers/views/pages/home/contact.html',
            controller: 'ContactController'
        })
        .when('/tours', {
            templateUrl: 'app/component/customers/views/pages/tour/tour.html',
            controller: 'TourController'
        })
        .when('/tour-detail', {
            templateUrl: 'app/component/customers/views/pages/tour/tour-details.html',
            controller: 'TourDetailController'
        })
        .when('/tourism-location', {
            templateUrl: 'app/component/customers/views/pages/location/location-tour.html',
            controller: 'LocationController'
        })
        .when('/hotel', {
            templateUrl: 'app/component/customers/views/pages/hotel/hotel.html',
            controller: 'HotelController'
        })
        .when('/drive-move', {
            templateUrl: 'app/component/customers/views/pages/move/drive-move.html',
            controller: 'DriveMoveController'
        })
        /**
         * Authentication
         */
        .when('/sign-in', {
            templateUrl: 'app/component/customers/views/pages/auth/sign-in.html',
            controller: 'LoginController'
        })
        .when('/sign-up', {
            templateUrl: 'app/component/customers/views/pages/auth/sign-up.html',
            controller: 'SignupController'
        })
        .when('/forgot-password', {
            templateUrl: 'app/component/customers/views/pages/password/forgot.html',
            controller: 'ForgotPwController'
        })
        .otherwise({
            redirectTo: '/home'
        })

    if (window.history && window.history.pushState) {
        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });
    }
});