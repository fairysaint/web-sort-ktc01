// ======================================
// Charts Methods
// ======================================

const ChartMethods = {

    // ==========================
    // Lấy dữ liệu biểu đồ
    // ==========================
    async fetchChartData() {

        let query =
            _supabase
                .from("productivity_data")
                .select(
                    "ngay_chuan, thao_tac, sl_stops_cn"
                );

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

            return;

        }

        const chartMap = {};

        data.forEach(item => {

            if (
                !this.isRowMatchingTime(
                    item.ngay_chuan
                )
            ) {
                return;
            }

            const key =
                Utils.normalizeAction(
                    item.thao_tac
                );

            chartMap[key] =
                (chartMap[key] || 0) +
                Utils.toNumber(
                    item.sl_stops_cn
                );

        });

        this.renderChart(

            Object.keys(chartMap),

            Object.values(chartMap)

        );

    },

    // ==========================
    // Hiển thị biểu đồ
    // ==========================
    renderChart(labels, data) {

        this.$nextTick(() => {

            try {

                const ctx =
                    document.getElementById(
                        "productivityChart"
                    );

                if (!ctx)
                    return;

                if (this.chartInstance) {

                    this.chartInstance.destroy();

                }

                this.chartInstance =
                    new Chart(ctx, {

                        type: "pie",

                        data: {

                            labels,

                            datasets: [

                                {

                                    data,

                                    backgroundColor: [

                                        "#06b6d4",
                                        "#ea580c",
                                        "#9333ea",
                                        "#f59e0b",
                                        "#3b82f6",
                                        "#ec4899",
                                        "#10b981",
                                        "#14b8a6",
                                        "#ef4444",
                                        "#6366f1"

                                    ],

                                    borderWidth: 1

                                }

                            ]

                        },

                        options: {

                            responsive: true,

                            maintainAspectRatio: false,

                            plugins: {

                                legend: {

                                    position: "bottom",

                                    labels: {

                                        boxWidth: 12,

                                        font: {

                                            size: 11

                                        }

                                    }

                                }

                            }

                        }

                    });

            }

            catch (err) {

                console.error(
                    "Chart Error:",
                    err
                );

            }

        });

    }

};
