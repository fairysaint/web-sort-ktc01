// ======================================
// Dashboard Methods
// ======================================

const DashboardMethods = {

    // ==========================
    // Lấy dữ liệu bộ lọc
    // ==========================
    async fetchFilterOptions() {

        let allDates = [];

        let hasMore = true;

        let page = 0;

        const step = 1000;

        while (hasMore) {

            const from = page * step;

            const to = from + step - 1;

            const { data } = await _supabase
                .from("productivity_data")
                .select("ngay_chuan")
                .range(from, to);

            if (!data || data.length === 0) {

                hasMore = false;

                break;

            }

            data.forEach(row => {

                if (row.ngay_chuan)
                    allDates.push(
                        Utils.cleanString(row.ngay_chuan)
                    );

            });

            if (data.length < step)
                hasMore = false;
            else
                page++;

        }

        this.allDatesRaw = allDates;

        const months = allDates
            .map(Utils.parseMonthYear)
            .filter(v => v);

        this.uniqueMonths =
            [...new Set(months)]
                .sort((a, b) =>
                    new Date(
                        b.split("/").reverse().join("-")
                    ) -
                    new Date(
                        a.split("/").reverse().join("-")
                    )
                );

        if (this.uniqueMonths.length)
            this.selectedMonthFilter =
                this.uniqueMonths[0];

        if (this.user.is_admin) {

            const { data } =
                await _supabase
                    .from("user_profiles")
                    .select("employee_name");

            if (data) {

                this.uniqueEmployees =
                    data
                        .map(e => e.employee_name)
                        .filter(Boolean);

            }

        }

    },

    // ==========================
    // Load toàn Dashboard
    // ==========================
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

        catch (err) {

            console.error(err);

        }

        finally {

            this.isLoading = false;

        }

    },

    // ==========================
    // Kiểm tra bộ lọc
    // ==========================
    isRowMatchingTime(dateStr) {

        if (!dateStr)
            return false;

        if (
            this.selectedDateFilter !== "ALL"
        ) {

            return (
                Utils.cleanString(dateStr) ===
                Utils.cleanString(
                    this.selectedDateFilter
                )
            );

        }

        if (
            this.selectedMonthFilter !== "ALL"
        ) {

            return (
                Utils.parseMonthYear(dateStr) ===
                this.selectedMonthFilter
            );

        }

        return true;

    },

    // ==========================
    // Card thống kê
    // ==========================
    async calculateCardsMetrics() {

        let query =
            _supabase
                .from("productivity_data")
                .select("ngay_chuan,thu_nhap");

        if (!this.user.is_admin) {

            query =
                query.eq(
                    "nhan_vien",
                    this.user.employee_name.trim()
                );

        }

        else if (
            this.adminFilter.selectedUser !==
            "ALL"
        ) {

            query =
                query.eq(
                    "nhan_vien",
                    this.adminFilter.selectedUser.trim()
                );

        }

        const { data } = await query;

        if (!data)
            return;

        const filtered =
            data.filter(item =>
                this.isRowMatchingTime(
                    item.ngay_chuan
                )
            );

        this.totalUniqueDaysCount =
            new Set(
                filtered.map(i => i.ngay_chuan)
            ).size;

        this.totalEarningsAllData =
            filtered.reduce(
                (sum, item) =>
                    sum +
                    Utils.toNumber(
                        item.thu_nhap
                    ),
                0
            );

    },

    // ==========================
    // AI Insight
    // ==========================
    calculateInsights(allGroundedData) {

        if (!allGroundedData.length) {

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

            if (!dateMap[item.ngay_chuan]) {

                dateMap[item.ngay_chuan] = {

                    income: 0,

                    stops: 0

                };

            }

            dateMap[item.ngay_chuan].income +=
                Utils.toNumber(item.thu_nhap);

            dateMap[item.ngay_chuan].stops +=
                Utils.toNumber(item.sl_stops_cn);

        });

        const dates =
            Object.keys(dateMap)
                .sort(Utils.compareDateAsc);

        const avgIncome =
            Math.round(

                Object.values(dateMap)
                    .reduce(
                        (s, d) =>
                            s + d.income,
                        0
                    ) /
                dates.length

            );

        let maxDate = "";

        let minDate = "";

        let maxStops = -1;

        let minStops = Infinity;

        dates.forEach(d => {

            const stop =
                dateMap[d].stops;

            if (stop > maxStops) {

                maxStops = stop;

                maxDate = d;

            }

            if (stop < minStops) {

                minStops = stop;

                minDate = d;

            }

        });

        let trendText = "Ổn định ➡️";

        let trendClass =
            "bg-gray-50 border-gray-100 text-gray-600";

        if (dates.length >= 2) {

            const mid =
                Math.ceil(
                    dates.length / 2
                );

            const first =
                dates.slice(0, mid);

            const second =
                dates.slice(mid);

            const avg1 =
                first.reduce(
                    (s, d) =>
                        s +
                        dateMap[d].stops,
                    0
                ) /
                first.length;

            const avg2 =
                second.reduce(
                    (s, d) =>
                        s +
                        dateMap[d].stops,
                    0
                ) /
                second.length;

            const percent =
                avg1 === 0
                    ? 0
                    : ((avg2 - avg1) / avg1) * 100;

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

        this.aiInsights = {

            avgEarningsPerDay: avgIncome,

            maxDate,

            minDate,

            trendText,

            trendClass

        };

    },

    // ==========================
    // Event Filter
    // ==========================
    handleAdminChange() {

        this.selectedDateFilter = "ALL";

        this.summaryPagination.page = 1;

        this.detailPagination.page = 1;

        this.loadAllDashboardData();

    },

    handleMonthChange() {

        this.selectedDateFilter = "ALL";

        this.summaryPagination.page = 1;

        this.detailPagination.page = 1;

        this.loadAllDashboardData();

    },

    handleDateChange() {

        this.summaryPagination.page = 1;

        this.detailPagination.page = 1;

        this.loadAllDashboardData();

    },

    refreshAll() {

        this.loadAllDashboardData();

    }

};
