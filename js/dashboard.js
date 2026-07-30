// ======================================
// Dashboard Methods
// ======================================

const DashboardMethods = {

    // ======================================
    // Load toàn bộ Dashboard
    // ======================================
    async loadAllDashboardData() {

        this.isLoading = true;

        try {

            await Promise.all([

                this.calculateCardsMetrics(),

                this.fetchSummaryTable(),

                this.fetchDetailTable(),

                this.fetchChartData()

            ]);

        }
        catch (e) {

            console.error(e);

        }
        finally {

            this.isLoading = false;

        }

    },

    // ======================================
    // Tính các Card thống kê
    // ======================================
    async calculateCardsMetrics() {

        let query = _supabase
            .from("productivity_data")
            .select("ngay_chuan, thu_nhap");

        if (!this.user.is_admin) {

            query = query.eq(
                "nhan_vien",
                this.user.employee_name.trim()
            );

        }
        else if (
            this.adminFilter.selectedUser !== "ALL"
        ) {

            query = query.eq(
                "nhan_vien",
                this.adminFilter.selectedUser.trim()
            );

        }

        const { data } = await query;

        if (!data) {

            this.totalUniqueDaysCount = 0;

            this.totalEarningsAllData = 0;

            return;

        }

        const filtered = data.filter(item =>
            this.isRowMatchingTime(item.ngay_chuan)
        );

        const uniqueDays = [
            ...new Set(
                filtered.map(x =>
                    Utils.cleanString(x.ngay_chuan)
                )
            )
        ];

        this.totalUniqueDaysCount = uniqueDays.length;

        this.totalEarningsAllData =
            filtered.reduce((sum, row) => {

                return (
                    sum +
                    Utils.toNumber(row.thu_nhap)
                );

            }, 0);

    },
      // ======================================
    // Bảng tổng hợp
    // ======================================
    async fetchSummaryTable() {

        const from =
            (this.summaryPagination.page - 1) *
            this.summaryPagination.pageSize;

        const to =
            from +
            this.summaryPagination.pageSize -
            1;

        let allData = [];

        let hasMore = true;

        let chunkPage = 0;

        const chunkSize = 4000;

        while (hasMore) {

            let query = _supabase
                .from("productivity_data")
                .select(
                    "ngay_chuan, nhan_vien, thao_tac, sl_stops_cn, thu_nhap"
                )
                .range(
                    chunkPage * chunkSize,
                    (chunkPage + 1) * chunkSize - 1
                );

            if (!this.user.is_admin) {

                query = query.eq(
                    "nhan_vien",
                    this.user.employee_name.trim()
                );

            }
            else if (
                this.adminFilter.selectedUser !== "ALL"
            ) {

                query = query.eq(
                    "nhan_vien",
                    this.adminFilter.selectedUser.trim()
                );

            }

            const {
                data,
                error
            } = await query;

            if (
                error ||
                !data ||
                data.length === 0
            ) {

                hasMore = false;

                break;

            }

            allData.push(

                ...data.filter(item =>
                    this.isRowMatchingTime(
                        item.ngay_chuan
                    )
                )

            );

            if (data.length < chunkSize) {

                hasMore = false;

            } else {

                chunkPage++;

            }

        }

        let resultData =
            Utils.groupSummaryData(allData);

        this.totalSummaryRows =
            resultData.length;

        this.calculateInsights(
            resultData
        );

        Utils.sortData(

            resultData,

            this.sortState.summary.column,

            this.sortState.summary.ascending

        );

        this.summaryList =
            resultData.slice(
                from,
                to + 1
            );

    },
      // ======================================
    // Phân tích AI Insight
    // ======================================
    calculateInsights(allGroundedData) {

        if (
            !allGroundedData ||
            allGroundedData.length === 0
        ) {

            this.aiInsights = {

                avgEarningsPerDay: 0,

                maxDate: "N/A",

                minDate: "N/A",

                trendText: "Không có dữ liệu",

                trendClass:
                    "bg-gray-50 border-gray-200 text-gray-500"

            };

            return;

        }

        const dateMap = {};

        allGroundedData.forEach(item => {

            const d = item.ngay_chuan;

            if (!dateMap[d]) {

                dateMap[d] = {

                    totalIncome: 0,

                    totalStops: 0

                };

            }

            dateMap[d].totalIncome +=
                Utils.toNumber(item.thu_nhap);

            dateMap[d].totalStops +=
                Utils.toNumber(item.sl_stops_cn);

        });

        const datesArray =
            Object.keys(dateMap).sort((a, b) => {

                return new Date(
                    a.split("/").reverse().join("-")
                ) -

                new Date(
                    b.split("/").reverse().join("-")
                );

            });

        const totalDays =
            datesArray.length;

        const sumIncome =
            allGroundedData.reduce((sum, item) => {

                return (
                    sum +
                    Utils.toNumber(item.thu_nhap)
                );

            }, 0);

        const avgIncome =
            totalDays > 0
                ? Math.round(sumIncome / totalDays)
                : 0;

        let maxStops = -1;

        let minStops = Infinity;

        let maxDate = "N/A";

        let minDate = "N/A";

        Object.keys(dateMap).forEach(date => {

            const stops =
                dateMap[date].totalStops;

            if (stops > maxStops) {

                maxStops = stops;

                maxDate = date;

            }

            if (stops < minStops) {

                minStops = stops;

                minDate = date;

            }

        });

        let trendText = "Ổn định ➡️";

        let trendClass =
            "bg-gray-50 border-gray-100 text-gray-600";

        if (totalDays >= 2) {

            const mid =
                Math.ceil(totalDays / 2);

            const firstHalf =
                datesArray.slice(0, mid);

            const secondHalf =
                datesArray.slice(mid);

            const avgStops = arr => {

                if (arr.length === 0)
                    return 0;

                return (
                    arr.reduce((sum, d) => {

                        return (
                            sum +
                            dateMap[d].totalStops
                        );

                    }, 0) / arr.length
                );

            };

            const avgFirst =
                avgStops(firstHalf);

            const avgSecond =
                avgStops(secondHalf);

            const percent =
                avgFirst > 0
                    ? (
                        (
                            avgSecond -
                            avgFirst
                        ) /
                        avgFirst
                    ) * 100
                    : 0;

            if (percent > 1) {

                trendText =
                    `Tăng trưởng 📈 (+${percent.toFixed(1)}%)`;

                trendClass =
                    "bg-emerald-50 border-emerald-100 text-emerald-700 font-bold";

            }
            else if (percent < -1) {

                trendText =
                    `Sụt giảm 📉 (${percent.toFixed(1)}%)`;

                trendClass =
                    "bg-rose-50 border-rose-100 text-rose-700 font-bold";

            }

        }
        else {

            trendText =
                "Cần tối thiểu 2 ngày";

        }

        this.aiInsights = {

            avgEarningsPerDay:
                avgIncome,

            maxDate:
                maxDate,

            minDate:
                minStops === Infinity
                    ? "N/A"
                    : minDate,

            trendText:
                trendText,

            trendClass:
                trendClass

        };

    },
      // ======================================
    // Bảng chi tiết
    // ======================================
    async fetchDetailTable() {

        const from =
            (this.detailPagination.page - 1) *
            this.detailPagination.pageSize;

        const to =
            from +
            this.detailPagination.pageSize -
            1;

        let query = _supabase
            .from("productivity_data")
            .select("*");

        if (!this.user.is_admin) {

            query = query.eq(
                "nhan_vien",
                this.user.employee_name.trim()
            );

        }
        else if (
            this.adminFilter.selectedUser !== "ALL"
        ) {

            query = query.eq(
                "nhan_vien",
                this.adminFilter.selectedUser.trim()
            );

        }

        const { data } = await query;

        let processedData = [];

        if (data) {

            processedData = data

                .filter(item =>
                    this.isRowMatchingTime(
                        item.ngay_chuan
                    )
                )

                .map(item => {

                    item.thao_tac =
                        Utils.normalizeAction(
                            item.thao_tac
                        );

                    return item;

                });

        }

        this.totalDetailRows =
            processedData.length;

        Utils.sortData(

            processedData,

            this.sortState.detail.column,

            this.sortState.detail.ascending

        );

        this.detailList =
            processedData.slice(
                from,
                to + 1
            );

    },

    // ======================================
    // Refresh Dashboard
    // ======================================
    refreshAll() {

        this.loadAllDashboardData();

    }

};
