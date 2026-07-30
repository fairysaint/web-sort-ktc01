// ======================================
// Table Methods
// ======================================

const TableMethods = {

    // ======================================
    // Sắp xếp bảng tổng hợp
    // ======================================
    sortSummary(columnName) {

        if (
            this.sortState.summary.column ===
            columnName
        ) {

            this.sortState.summary.ascending =
                !this.sortState.summary.ascending;

        }
        else {

            this.sortState.summary.column =
                columnName;

            this.sortState.summary.ascending = true;

        }

        this.summaryPagination.page = 1;

        this.fetchSummaryTable();

    },

    // ======================================
    // Sắp xếp bảng chi tiết
    // ======================================
    sortDetail(columnName) {

        if (
            this.sortState.detail.column ===
            columnName
        ) {

            this.sortState.detail.ascending =
                !this.sortState.detail.ascending;

        }
        else {

            this.sortState.detail.column =
                columnName;

            this.sortState.detail.ascending = true;

        }

        this.detailPagination.page = 1;

        this.fetchDetailTable();

    },

    // ======================================
    // Trang bảng tổng hợp
    // ======================================
    async changeSummaryPage(step) {

        const target =
            this.summaryPagination.page + step;

        if (
            target >= 1 &&
            target <= this.totalSummaryPages
        ) {

            this.summaryPagination.page =
                target;

            this.isLoading = true;

            await this.fetchSummaryTable();

            this.isLoading = false;

        }

    },

    // ======================================
    // Trang bảng chi tiết
    // ======================================
    async changeDetailPage(step) {

        const target =
            this.detailPagination.page + step;

        if (
            target >= 1 &&
            target <= this.totalDetailPages
        ) {

            this.detailPagination.page =
                target;

            this.isLoading = true;

            await this.fetchDetailTable();

            this.isLoading = false;

        }

    }

};
