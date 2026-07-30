// ======================================
// Chart Methods
// ======================================

const ChartMethods = {

    // ======================================
    // Lấy dữ liệu biểu đồ
    // ======================================
    async fetchChartData() {

        let query = _supabase
            .from("productivity_data")
            .select(
                "ngay_chuan, thao_tac, sl_stops_cn"
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

        const { data } = await query;

        if (!data) return;

        const chartMap = {};

        data.forEach(item => {

            if (
                !this.isRowMatchingTime(
                    item.ngay_chuan
                )
            ) return;

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

    // ======================================
    // Vẽ biểu đồ
    // ======================================
    renderChart(labels, values) {

        this.$nextTick(() => {

            try {

                const canvas =
                    document.getElementById(
                        "productivityChart"
                    );

                if (!canvas) return;

                if (this.chartInstance) {

                    this.chartInstance.destroy();

                }

                this.chartInstance =
                    new Chart(canvas, {

                        type: "pie",

                        data: {

                            labels,

                            datasets: [

                                {

                                    data: values,

                                    backgroundColor: [

                                        "#06b6d4",

                                        "#ea580c",

                                        "#9333ea",

                                        "#f59e0b",

                                        "#3b82f6",

                                        "#ec4899",

                                        "#10b981"

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

                                        boxWidth: 10,

                                        font: {

                                            size: 10

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
