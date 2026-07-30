// ======================================
// Tables Methods
// ======================================

const TableMethods = {

    // ==========================
    // Bảng tổng hợp
    // ==========================
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

            let dataQuery =
                _supabase
                    .from("productivity_data")
                    .select(
                        "ngay_chuan, nhan_vien, thao_tac, sl_stops_cn, thu_nhap"
                    )
                    .range(
                        chunkPage * chunkSize,
                        (chunkPage + 1) * chunkSize - 1
                    );

            if (!this.user.is_admin) {

                dataQuery =
                    dataQuery.eq(
                        "nhan_vien",
                        this.user.employee_name.trim()
                    );

            }

            else if (
                this.adminFilter.selectedUser !==
                "ALL"
            ) {

                dataQuery =
                    dataQuery.eq(
                        "nhan_vien",
                        this.adminFilter.selectedUser.trim()
                    );

            }

            const {
                data: rawChunk,
                error
            } = await dataQuery;

            if (
                error ||
                !rawChunk ||
                rawChunk.length === 0
            ) {

                hasMore = false;

                break;

            }

            allData.push(

                ...rawChunk.filter(item =>
                    this.isRowMatchingTime(
                        item.ngay_chuan
                    )
                )

            );

            if (
                rawChunk.length <
                chunkSize
            ) {

                hasMore = false;

            }

            else {

                chunkPage++;

            }

        }

        // Gom nhóm dữ liệu
        let resultData =
            Utils.groupSummaryData(
                allData
            );

        this.totalSummaryRows =
            resultData.length;

        // AI Insight
        this.calculateInsights(
            resultData
        );

        // Sắp xếp
        Utils.sortData(

            resultData,

            this.sortState.summary.column,

            this.sortState.summary.ascending

        );

        // Phân trang
        this.summaryList =
            resultData.slice(
                from,
                to + 1
            );

    },
      // ==========================
    // Bảng chi tiết
    // ==========================
    async fetchDetailTable() {

        const from =
            (this.detailPagination.page - 1) *
            this.detailPagination.pageSize;

        const to =
            from +
            this.detailPagination.pageSize -
            1;

        let query =
            _supabase
                .from("productivity_data")
                .select("*");

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

        const { data, error } =
            await query;

        if (error) {

            console.error(error);

            this.detailList = [];

            this.totalDetailRows = 0;

            return;

        }

        let processedData = [];

        if (data) {

            processedData =
                data
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
      // ==========================
    // Sắp xếp bảng tổng hợp
    // ==========================
    sortSummary(columnName) {

        if (this.sortState.summary.column === columnName) {

            this.sortState.summary.ascending =
                !this.sortState.summary.ascending;

        }

        else {

            this.sortState.summary.column =
                columnName;

            this.sortState.summary.ascending =
                true;

        }

        this.summaryPagination.page = 1;

        this.fetchSummaryTable();

    },

    // ==========================
    // Sắp xếp bảng chi tiết
    // ==========================
    sortDetail(columnName) {

        if (this.sortState.detail.column === columnName) {

            this.sortState.detail.ascending =
                !this.sortState.detail.ascending;

        }

        else {

            this.sortState.detail.column =
                columnName;

            this.sortState.detail.ascending =
                true;

        }

        this.detailPagination.page = 1;

        this.fetchDetailTable();

    },

    // ==========================
    // Chuyển trang Summary
    // ==========================
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

    // ==========================
    // Chuyển trang Detail
    // ==========================
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
