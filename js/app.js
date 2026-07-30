const { createApp } = Vue;

createApp({

    data() {
        return {

            currentScreen: "login",

            authForm: {
                userId: "",
                password: "",
                employeeName: "",
                isRegister: false
            },

            user: null,

            //=====================
            // Dashboard
            //=====================

            summaryList: [],
            detailList: [],

            summaryPagination: {
                page: 1,
                pageSize: 20
            },

            detailPagination: {
                page: 1,
                pageSize: 20
            },

            totalSummaryRows: 0,
            totalDetailRows: 0,

            totalUniqueDaysCount: 0,
            totalEarningsAllData: 0,

            allDatesRaw: [],
            uniqueMonths: [],
            uniqueEmployees: [],

            selectedDateFilter: "ALL",
            selectedMonthFilter: "ALL",

            adminFilter: {
                selectedUser: "ALL"
            },

            isLoading: false,

            chartInstance: null,

            sortState: {

                summary: {
                    column: "ngay_chuan",
                    ascending: false
                },

                detail: {
                    column: "moc_gio",
                    ascending: true
                }

            },

            aiInsights: {

                avgEarningsPerDay: 0,

                maxDate: "N/A",

                minDate: "N/A",

                trendText: "Đang tính...",

                trendClass:
                    "bg-gray-50 border-gray-100 text-gray-700"

            }

        };
    },

    computed: {

        totalSummaryPages() {

            return (
                Math.ceil(
                    (this.totalSummaryRows || 0) /
                    this.summaryPagination.pageSize
                ) || 1
            );

        },

        totalDetailPages() {

            return (
                Math.ceil(
                    (this.totalDetailRows || 0) /
                    this.detailPagination.pageSize
                ) || 1
            );

        },

        uniqueDates() {

            if (
                !this.allDatesRaw ||
                this.allDatesRaw.length === 0
            ) {
                return [];
            }

            let filteredDates = this.allDatesRaw;

            if (this.selectedMonthFilter !== "ALL") {

                filteredDates = this.allDatesRaw.filter(
                    d =>
                        Utils.parseMonthYear(d) ===
                        this.selectedMonthFilter
                );

            }

            return [...new Set(filteredDates)].sort(
                Utils.compareDateDesc
            );

        }

    },

    mounted() {

        this.checkCurrentSession();

    },

    methods: {

        //=========================
        // Authentication
        //=========================
        ...AuthMethods,

        //=========================
        // Filter
        //=========================
        ...FilterMethods,

        //=========================
        // Dashboard
        //=========================
        ...DashboardMethods,

        //=========================
        // Table
        //=========================
        ...TableMethods,

        //=========================
        // Chart
        //=========================
        ...ChartMethods

    }

}).mount("#app");
