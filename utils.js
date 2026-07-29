// ======================================
// Utils Functions
// Dùng chung cho toàn bộ hệ thống
// ======================================

const Utils = {

    // ==========================
    // Chuẩn hóa chuỗi
    // ==========================
    cleanString(value) {
        if (value === null || value === undefined) return "";
        return String(value).trim();
    },

    // ==========================
    // Chuyển ngày sang MM/YYYY
    // Hỗ trợ:
    // YYYY/MM/DD
    // YYYY-MM-DD
    // DD/MM/YYYY
    // ==========================
    parseMonthYear(dateStr) {

        if (!dateStr) return "";

        const clean = String(dateStr)
            .trim()
            .replace(/-/g, "/");

        const parts = clean.split("/");

        if (parts.length !== 3) return "";

        // YYYY/MM/DD
        if (parts[0].length === 4) {
            return `${parts[1].padStart(2, "0")}/${parts[0]}`;
        }

        // DD/MM/YYYY
        return `${parts[1].padStart(2, "0")}/${parts[2]}`;
    },

    // ==========================
    // Chuẩn hóa tên thao tác
    // ==========================
    normalizeAction(action) {

        if (!action) return "Khác";

        let txt = String(action).trim();

        if (
            txt.includes("C") ||
            txt.toLowerCase().includes("cấp đơn")
        ) {
            return "Cấp đơn vào Autosorting";
        }

        if (
            txt.includes("Đóng ki") ||
            txt.toLowerCase().includes("đóng kiện autosorting")
        ) {
            return "Đóng kiện Autosorting";
        }

        if (
            txt.toLowerCase().includes("đóng kiện manual")
        ) {
            return "Đóng kiện Manual";
        }

        if (
            txt.toLowerCase().includes("rã kiện")
        ) {
            return "Rã kiện tại kho Manual";
        }

        if (
            txt.toLowerCase().includes("đổ bao")
        ) {
            return "Đổ bao tải";
        }

        if (
            txt.toLowerCase().includes("chia hàng")
        ) {
            return "Chia hàng vào rổ";
        }

        return txt;
    },

    // ==========================
    // Format tiền VNĐ
    // ==========================
    formatMoney(value) {

        const money = Number(value || 0);

        return money.toLocaleString("vi-VN") + " đ";
    },

    // ==========================
    // Format số
    // ==========================
    formatNumber(value) {

        return Number(value || 0).toLocaleString("vi-VN");
    },

    // ==========================
    // Ép Number an toàn
    // ==========================
    toNumber(value) {

        const n = Number(value);

        return isNaN(n) ? 0 : n;
    },

    // ==========================
    // So sánh ngày mới nhất
    // ==========================
    compareDateDesc(a, b) {

        return new Date(b) - new Date(a);
    },

    // ==========================
    // So sánh ngày cũ nhất
    // ==========================
    compareDateAsc(a, b) {

        return new Date(a) - new Date(b);
    },

    // ==========================
    // Format ngày
    // ==========================
    formatDate(date) {

        if (!date) return "";

        return String(date).replace(/-/g, "/");
    },

    // ==========================
    // Kiểm tra rỗng
    // ==========================
    isEmpty(value) {

        return (
            value === null ||
            value === undefined ||
            String(value).trim() === ""
        );
    }

};
