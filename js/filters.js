// ======================================
// Filter Methods
// ======================================

const FilterMethods = {

    // ======================================
    // Chuẩn hóa tháng/năm
    // ======================================
    parseMonthYear(dateStr) {

        return Utils.parseMonthYear(dateStr);

    },

    // ======================================
    // Nạp danh sách tháng và ngày
    // ======================================
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

                if (row.ngay_chuan) {

                    allDates.push(
                        Utils.cleanString(row.ngay_chuan)
                    );

                }

            });

            if (data.length < step) {

                hasMore = false;

            } else {

                page++;

            }

        }

        this.allDatesRaw = allDates;

        const months = allDates
            .map(d => Utils.parseMonthYear(d))
            .filter(v => v);

        this.uniqueMonths =
            [...new Set(months)]
            .sort((a, b) => {

                return new Date(
                    b.split("/").reverse().join("-")
                ) -

                new Date(
                    a.split("/").reverse().join("-")
                );

            });

        if (
            this.uniqueMonths.length > 0 &&
            this.selectedMonthFilter === "ALL"
        ) {

            this.selectedMonthFilter =
                this.uniqueMonths[0];

        }

        if (this.user.is_admin) {

            const { data } =
                await _supabase
                    .from("user_profiles")
                    .select("employee_name");

            if (data) {

                this.uniqueEmployees =
                    data
                        .map(x => x.employee_name)
                        .filter(Boolean);

            }

        }

    },

    // ======================================
    // Kiểm tra dòng dữ liệu
    // ======================================
    isRowMatchingTime(dateStr) {

        if (!dateStr) return false;

        if (this.selectedDateFilter !== "ALL") {

            return (
                Utils.cleanString(dateStr) ===
                Utils.cleanString(
                    this.selectedDateFilter
                )
            );

        }

        if (this.selectedMonthFilter !== "ALL") {

            return (
                Utils.parseMonthYear(dateStr) ===
                this.selectedMonthFilter
            );

        }

        return true;

    },

    // ======================================
    // Đổi nhân viên
    // ======================================
    handleAdminChange() {

        this.selectedDateFilter = "ALL";

        this.summaryPagination.page = 1;

        this.detailPagination.page = 1;

        this.loadAllDashboardData();

    },

    // ======================================
    // Đổi tháng
    // ======================================
    handleMonthChange() {

        this.selectedDateFilter = "ALL";

        this.summaryPagination.page = 1;

        this.detailPagination.page = 1;

        this.loadAllDashboardData();

    },

    // ======================================
    // Đổi ngày
    // ======================================
    handleDateChange() {

        this.summaryPagination.page = 1;

        this.detailPagination.page = 1;

        this.loadAllDashboardData();

    }

};
