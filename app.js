const SUPABASE_URL = "https://twraggzfzojuwrwrvhta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3cmFnZ3pmem9qdXdyd3J2aHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTk4MzcsImV4cCI6MjA5NTQzNTgzN30.5I7eNPiF2pLCaOVZICU0KYGYpfitm5NuciC8EQ24ND8"; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const { createApp } = Vue;

createApp({
  data() {
    return {
      currentScreen: 'login',
      authForm: { userId: '', password: '', employeeName: '', isRegister: false },
      user: null,
      
      summaryList: [], 
      detailList: [],  

      summaryPagination: { page: 1, pageSize: 20 },
      detailPagination: { page: 1, pageSize: 20 },
      
      totalSummaryRows: 0,
      totalDetailRows: 0,

      totalUniqueDaysCount: 0,
      totalEarningsAllData: 0,

      allDatesRaw: [], // Lưu trữ danh sách ngày thô để computed tính toán            
      uniqueMonths: [], 
      selectedDateFilter: 'ALL',
      selectedMonthFilter: 'ALL', 
      isLoading: false,
      chartInstance: null,

      adminFilter: { selectedUser: 'ALL' },

      sortState: {
        summary: { column: 'ngay_chuan', ascending: false },
        detail: { column: 'moc_gio', ascending: true }
      },

      aiInsights: {
        avgEarningsPerDay: 0,
        maxDate: 'N/A',
        minDate: 'N/A',
        trendText: 'Đang tính...',
        trendClass: 'bg-gray-50 border-gray-100 text-gray-700'
      }
    };
  },

  computed: {
    totalSummaryPages() {
      return Math.ceil((this.totalSummaryRows || 0) / this.summaryPagination.pageSize) || 1;
    },
    totalDetailPages() {
      return Math.ceil((this.totalDetailRows || 0) / this.detailPagination.pageSize) || 1;
    },

    // BỘ LỌC NGÀY ĐỘNG: Chỉ hiện các ngày thuộc Tháng đang chọn
    uniqueDates() {
      if (!this.allDatesRaw || this.allDatesRaw.length === 0) return [];
      
      let filteredDates = this.allDatesRaw;
      
      // Nếu đang chọn một tháng cụ thể, lọc lấy các ngày có đuôi khớp với tháng đó
      if (this.selectedMonthFilter !== 'ALL') {
        filteredDates = this.allDatesRaw.filter(d => this.parseMonthYear(d) === this.selectedMonthFilter);
      }
      
      // Loại bỏ trùng lặp và sắp xếp ngày mới nhất lên đầu (hỗ trợ định dạng YYYY-MM-DD)
      return [...new Set(filteredDates)].sort((a, b) => new Date(b) - new Date(a));
    }
  },

  mounted() {
    this.checkCurrentSession();
  },

  methods: {
    async checkCurrentSession() {
      const { data: { session } } = await _supabase.auth.getSession();
      if (session && session.user) {
        await this.getUserProfile(session.user.id);
      } else {
        this.currentScreen = 'login';
      }
    },

    async handleAuth() {
      if (!this.authForm.userId || !this.authForm.password) {
        alert("Vui lòng điền đầy đủ Mã nhân viên và Mật khẩu!");
        return;
      }

      // Kiểm tra độ dài mật khẩu bắt buộc của Supabase Auth (tối thiểu 6 ký tự)
      if (this.authForm.password.length < 6) {
        alert("Mật khẩu phải có ít nhất 6 ký tự!");
        return;
      }

      // Loại bỏ khoảng trắng thừa và ký tự đặc biệt khỏi Mã nhân viên để làm Email chuẩn
      const uId = this.authForm.userId.trim();
      const cleanUid = uId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const emailFake = `${cleanUid}@nangsuat.local`;
      
      this.isLoading = true;

      try {
        if (this.authForm.isRegister) {
          if (!this.authForm.employeeName || !this.authForm.employeeName.trim()) { 
            alert("Vui lòng nhập Họ và Tên nhân viên!"); 
            this.isLoading = false; 
            return; 
          }
          
          // 1. Gọi Supabase SignUp
          const { data, error } = await _supabase.auth.signUp({ 
            email: emailFake, 
            password: this.authForm.password 
          });
          
          if (error) {
            if (error.message.includes("User already registered")) {
              alert("Mã nhân viên này đã được đăng ký tài khoản trước đó!");
            } else {
              alert("Lỗi đăng ký Auth: " + error.message);
            }
            this.isLoading = false;
            return;
          }
          
          if (data && data.user) {
            // 2. Dùng UPSERT thay vì INSERT để tự động xử lý nếu dòng profile đã được sinh ra sẵn
            const { error: profileError } = await _supabase
              .from('user_profiles')
              .upsert(
                { 
                  id: data.user.id, 
                  user_id: uId, 
                  employee_name: this.authForm.employeeName.trim(), 
                  is_admin: false 
                },
                { onConflict: 'id' } // Rõ ràng chỉ định xung đột dựa trên cột khóa chính id
              );

            if (profileError) {
              console.error("Lỗi tạo profile chi tiết:", profileError);
              alert("Lỗi lưu hồ sơ: " + profileError.message);
              this.isLoading = false;
              return;
            }

            alert("Đăng ký thành công! Bạn có thể Đăng nhập ngay bây giờ.");
            
            // Chuyển form về trạng thái đăng nhập
            this.authForm.isRegister = false;
            this.authForm.password = '';
          }
        } else {
          // Xử lý Đăng nhập thông thường
          const { data, error } = await _supabase.auth.signInWithPassword({ 
            email: emailFake, 
            password: this.authForm.password 
          });
          
          if (error) {
            alert("Mã nhân viên hoặc Mật khẩu không chính xác!");
          } else if (data && data.user) {
            await this.getUserProfile(data.user.id);
          }
        }
      } catch (err) {
        console.error("Lỗi không xác định:", err);
      } finally { 
        this.isLoading = false; 
      }
    },
    async getUserProfile(uuid) {
      const { data } = await _supabase.from('user_profiles').select('user_id, employee_name, is_admin').eq('id', uuid).single();
      if (data) {
        this.user = data;
        this.currentScreen = 'dashboard';
        await this.fetchFilterOptions(); 
        await this.loadAllDashboardData();
      }
    },

    // Hàm chuẩn hóa chuỗi ngày bất kỳ về dạng chuẩn MM/YYYY để so sánh bộ lọc
    parseMonthYear(dateStr) {
      if (!dateStr) return '';
      const cleanStr = String(dateStr).trim().replace(/-/g, '/');
      const parts = cleanStr.split('/');
      if (parts.length === 3) {
        // Nếu chuỗi có dạng YYYY/MM/DD
        if (parts[0].length === 4) {
          return `${parts[1].padStart(2, '0')}/${parts[0]}`;
        }
        // Nếu chuỗi có dạng DD/MM/YYYY
        return `${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
      return '';
    },

    async fetchFilterOptions() {
   let allDates = [];
   let hasMore = true;
   let page = 0;
   const step = 1000;

   while (hasMore) { 
     const from = page * step;
     const to = from + step - 1;
     const { data: dateData } = await _supabase.from('productivity_data').select('ngay_chuan').range(from, to);

     if (dateData && dateData.length > 0) {
       dateData.forEach(d => {
         if (d.ngay_chuan) allDates.push(String(d.ngay_chuan).trim());
       });
       if (dateData.length < step) hasMore = false;
       else page++;
     } else {
       hasMore = false;
     }
   }

   // Lưu vào biến ngày thô
   this.allDatesRaw = allDates;

   // Gom danh sách tháng duy nhất từ mảng ngày thô, tháng gần nhất lên đầu
   const months = allDates.map(d => this.parseMonthYear(d)).filter(v => v);
   this.uniqueMonths = [...new Set(months)].sort((a, b) => {
     return new Date(b.split('/').reverse().join('-')) - new Date(a.split('/').reverse().join('-'));
   });

   if (this.uniqueMonths.length > 0) {
     this.selectedMonthFilter = this.uniqueMonths[0];
   }

   if (this.user.is_admin) {
     const { data: empData } = await _supabase.from('user_profiles').select('employee_name');
     if (empData) {
       this.uniqueEmployees = empData.map(e => e.employee_name).filter(v => v);
     }
   }
 },

    async loadAllDashboardData() {
      this.isLoading = true;
      try {
        await Promise.all([
          this.calculateCardsMetrics(), 
          this.fetchSummaryTable(),      
          this.fetchDetailTable(),       
          this.fetchChartData()          
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        this.isLoading = false;
      }
    },

    // Kiểm tra dòng dữ liệu có khớp bộ lọc Thời gian hiện tại hay không
    isRowMatchingTime(dateStr) {
      if (!dateStr) return false;
      if (this.selectedDateFilter !== 'ALL') {
        return String(dateStr).trim() === this.selectedDateFilter.trim();
      }
      if (this.selectedMonthFilter !== 'ALL') {
        return this.parseMonthYear(dateStr) === this.selectedMonthFilter.trim();
      }
      return true;
    },

    async calculateCardsMetrics() {
      let query = _supabase.from('productivity_data').select('ngay_chuan, thu_nhap');
      if (!this.user.is_admin) query = query.eq('nhan_vien', this.user.employee_name.trim());
      else if (this.adminFilter.selectedUser !== 'ALL') query = query.eq('nhan_vien', this.adminFilter.selectedUser.trim());

      const { data } = await query;
      if (data) {
        // Lọc Client-side để tránh lỗi RPC Postgres
        const filtered = data.filter(item => this.isRowMatchingTime(item.ngay_chuan));
        const uniqueDays = [...new Set(filtered.map(i => String(i.ngay_chuan).trim()))];
        
        this.totalUniqueDaysCount = uniqueDays.length;
        this.totalEarningsAllData = filtered.reduce((sum, i) => sum + Number(i.thu_nhap || 0), 0);
      }
    },

    async fetchSummaryTable() {
      const from = (this.summaryPagination.page - 1) * this.summaryPagination.pageSize;
      const to = from + this.summaryPagination.pageSize - 1;

      const clientGroupMap = {};
      let hasMore = true;
      let chunkPage = 0;
      const chunkSize = 4000; 

      while (hasMore) {
        let dataQuery = _supabase
          .from('productivity_data')
          .select('ngay_chuan, nhan_vien, thao_tac, sl_stops_cn, thu_nhap')
          .range(chunkPage * chunkSize, (chunkPage + 1) * chunkSize - 1);

        if (!this.user.is_admin) dataQuery = dataQuery.eq('nhan_vien', this.user.employee_name.trim());
        else if (this.adminFilter.selectedUser !== 'ALL') dataQuery = dataQuery.eq('nhan_vien', this.adminFilter.selectedUser.trim());

        const { data: rawChunk, error } = await dataQuery;

        if (error || !rawChunk || rawChunk.length === 0) {
          hasMore = false;
          break;
        }

        rawChunk.forEach(item => {
          // Chỉ gom nhóm các dòng thỏa mãn bộ lọc Tháng / Ngày
          if (!this.isRowMatchingTime(item.ngay_chuan)) return;

          const dKey = item.ngay_chuan ? String(item.ngay_chuan).trim() : 'Chưa rõ';
          const empKey = item.nhan_vien ? String(item.nhan_vien).trim() : 'Chưa rõ';
          
          let actionKey = item.thao_tac ? String(item.thao_tac).trim() : 'Khác';
          if (actionKey.includes('C') || actionKey.toLowerCase().includes('cấp đơn')) actionKey = "Cấp đơn vào Autosorting";
          else if (actionKey.includes('Đóng ki') || actionKey.toLowerCase().includes('đóng kiện autosorting')) actionKey = "Đóng kiện Autosorting";
          else if (actionKey.toLowerCase().includes('đóng kiện manual')) actionKey = "Đóng kiện Manual";
          else if (actionKey.toLowerCase().includes('rã kiện')) actionKey = "Rã kiện tại kho Manual";
          else if (actionKey.toLowerCase().includes('đổ bao')) actionKey = "Đổ bao tải";
          else if (actionKey.toLowerCase().includes('chia hàng')) actionKey = "Chia hàng vào rổ";

          const key = `${dKey}_${empKey}_${actionKey}`;
          
          if (!clientGroupMap[key]) {
            clientGroupMap[key] = { ngay_chuan: dKey, nhan_vien: empKey, thao_tac: actionKey, sl_stops_cn: 0, thu_nhap: 0 };
          }
          clientGroupMap[key].sl_stops_cn += Number(item.sl_stops_cn || 0);
          clientGroupMap[key].thu_nhap += Number(item.thu_nhap || 0);
        });

        if (rawChunk.length < chunkSize) hasMore = false;
        else chunkPage++;
      }

      let resultData = Object.values(clientGroupMap);
      this.totalSummaryRows = resultData.length;

      this.calculateInsights(resultData);

      const col = this.sortState.summary.column;
      const isAsc = this.sortState.summary.ascending;
      resultData.sort((a, b) => {
        let valA = a[col];
        let valB = b[col];
        if (col === 'sl_stops_cn' || col === 'thu_nhap') {
          return isAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
        }
        return isAsc 
          ? String(valA).localeCompare(String(valB), undefined, { numeric: true }) 
          : String(valB).localeCompare(String(valA), undefined, { numeric: true });
      });

      this.summaryList = resultData.slice(from, to + 1);
    },

    calculateInsights(allGroundedData) {
      if (!allGroundedData || allGroundedData.length === 0) {
        this.aiInsights = {
          avgEarningsPerDay: 0, maxDate: 'N/A', minDate: 'N/A',
          trendText: 'Không có dữ liệu', trendClass: 'bg-gray-50 border-gray-200 text-gray-500'
        };
        return;
      }

      const dateMap = {};
      allGroundedData.forEach(item => {
        const d = item.ngay_chuan;
        if (!dateMap[d]) dateMap[d] = { totalIncome: 0, totalStops: 0 };
        dateMap[d].totalIncome += Number(item.thu_nhap || 0);
        dateMap[d].totalStops += Number(item.sl_stops_cn || 0);
      });

      const datesArray = Object.keys(dateMap).sort((a, b) => {
        return new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'));
      });
      const totalDays = datesArray.length;

      const sumEarnings = allGroundedData.reduce((sum, i) => sum + Number(i.thu_nhap || 0), 0);
      const avgEarnings = totalDays > 0 ? Math.round(sumEarnings / totalDays) : 0;

      let maxStops = -1, minStops = Infinity;
      let maxDate = 'N/A', minDate = 'N/A';

      Object.keys(dateMap).forEach(d => {
        const stops = dateMap[d].totalStops;
        if (stops > maxStops) { maxStops = stops; maxDate = d; }
        if (stops < minStops) { minStops = stops; minDate = d; }
      });

      let trendText = 'Ổn định ➡️';
      let trendClass = 'bg-gray-50 border-gray-100 text-gray-600';

      if (totalDays >= 2) {
        const mid = Math.ceil(totalDays / 2);
        const firstHalf = datesArray.slice(0, mid);
        const secondHalf = datesArray.slice(mid);

        const getAvgStops = (arr) => {
          if (arr.length === 0) return 0;
          return arr.reduce((sum, d) => sum + dateMap[d].totalStops, 0) / arr.length;
        };

        const avgFirst = getAvgStops(firstHalf);
        const avgSecond = getAvgStops(secondHalf);
        const percentChange = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;

        if (percentChange > 1) {
          trendText = `Tăng trưởng 📈 (+${percentChange.toFixed(1)}%)`;
          trendClass = 'bg-emerald-50 border-emerald-100 text-emerald-700 font-bold';
        } else if (percentChange < -1) {
          trendText = `Sụt giảm 📉 (${percentChange.toFixed(1)}%)`;
          trendClass = 'bg-rose-50 border-rose-100 text-rose-700 font-bold';
        }
      } else {
        trendText = 'Cần tối thiểu 2 ngày';
      }

      this.aiInsights = {
        avgEarningsPerDay: avgEarnings,
        maxDate: maxDate,
        minDate: (minStops === Infinity) ? 'N/A' : minDate,
        trendText: trendText,
        trendClass: trendClass
      };
    },

    async fetchDetailTable() {
      // SỬA LỖI ĐỊNH VỊ PHÂN TRANG (Dùng đúng detailPagination thay vì summaryPagination)
      const from = (this.detailPagination.page - 1) * this.detailPagination.pageSize;
      const to = from + this.detailPagination.pageSize - 1;

      let query = _supabase.from('productivity_data').select('*');
      if (!this.user.is_admin) query = query.eq('nhan_vien', this.user.employee_name.trim());
      else if (this.adminFilter.selectedUser !== 'ALL') query = query.eq('nhan_vien', this.adminFilter.selectedUser.trim());

      const { data } = await query;
      let processedData = [];

      if (data) {
        // Lọc Client và map chuẩn font chữ tiếng việt
        processedData = data
          .filter(item => this.isRowMatchingTime(item.ngay_chuan))
          .map(item => {
            if (item.thao_tac) {
              let tx = item.thao_tac.trim();
              if (tx.includes('C') || tx.toLowerCase().includes('cấp đơn')) item.thao_tac = "Cấp đơn vào Autosorting";
              else if (tx.includes('Đóng ki') || tx.toLowerCase().includes('đóng kiện autosorting')) item.thao_tac = "Đóng kiện Autosorting";
              else if (tx.toLowerCase().includes('đóng kiện manual')) item.thao_tac = "Đóng kiện Manual";
              else if (tx.toLowerCase().includes('rã kiện')) item.thao_tac = "Rã kiện tại kho Manual";
              else if (tx.toLowerCase().includes('đổ bao')) item.thao_tac = "Đổ bao tải";
              else if (tx.toLowerCase().includes('chia hàng')) item.thao_tac = "Chia hàng vào rổ";
            }
            return item;
          });
      }

      // Cập nhật lại tổng số dòng thực tế sau khi lọc để tính tổng số trang chính xác
      this.totalDetailRows = processedData.length;

      const col = this.sortState.detail.column;
      const isAsc = this.sortState.detail.ascending;
      processedData.sort((a, b) => {
        let valA = a[col];
        let valB = b[col];
        if (col === 'sl_stops_cn' || col === 'thu_nhap') {
          return isAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
        }
        return isAsc 
          ? String(valA).localeCompare(String(valB), undefined, { numeric: true }) 
          : String(valB).localeCompare(String(valA), undefined, { numeric: true });
      });

      // Cắt mảng chuẩn theo phân trang của bảng chi tiết
      this.detailList = processedData.slice(from, to + 1);
    },
    sortSummary(columnName) {
      if (this.sortState.summary.column === columnName) {
        this.sortState.summary.ascending = !this.sortState.summary.ascending;
      } else {
        this.sortState.summary.column = columnName;
        this.sortState.summary.ascending = true;
      }
      this.summaryPagination.page = 1;
      this.fetchSummaryTable();
    },

    sortDetail(columnName) {
      if (this.sortState.detail.column === columnName) {
        this.sortState.detail.ascending = !this.sortState.detail.ascending;
      } else {
        this.sortState.detail.column = columnName;
        this.sortState.detail.ascending = true;
      }
      this.detailPagination.page = 1;
      this.fetchDetailTable();
    },

    async fetchChartData() {
      let query = _supabase.from('productivity_data').select('ngay_chuan, thao_tac, sl_stops_cn');
      if (!this.user.is_admin) query = query.eq('nhan_vien', this.user.employee_name.trim());
      else if (this.adminFilter.selectedUser !== 'ALL') query = query.eq('nhan_vien', this.adminFilter.selectedUser.trim());

      const { data } = await query;
      if (data) {
        const chartMap = {};
        data.forEach(item => {
          if (!this.isRowMatchingTime(item.ngay_chuan)) return;

          let key = item.thao_tac ? item.thao_tac.trim() : "Khác";
          if (key.includes('C') || key.toLowerCase().includes('cấp đơn')) key = "Cấp đơn vào Autosorting";
          else if (key.includes('Đóng ki') || key.toLowerCase().includes('đóng kiện autosorting')) key = "Đóng kiện Autosorting";
          else if (key.toLowerCase().includes('đóng kiện manual')) key = "Đóng kiện Manual";
          else if (key.toLowerCase().includes('rã kiện')) key = "Rã kiện tại kho Manual";
          else if (key.toLowerCase().includes('đổ bao')) key = "Đổ bao tải";
          else if (key.toLowerCase().includes('chia hàng')) key = "Chia hàng vào rổ";

          chartMap[key] = (chartMap[key] || 0) + Number(item.sl_stops_cn || 0);
        });
        this.renderChart(Object.keys(chartMap), Object.values(chartMap));
      }
    },

    renderChart(labels, data) {
      this.$nextTick(() => {
        try {
          const ctx = document.getElementById('productivityChart');
          if (!ctx) return;
          if (this.chartInstance) this.chartInstance.destroy();

          this.chartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
              labels: labels,
              datasets: [{
                data: data,
                backgroundColor: ['#06b6d4', '#ea580c', '#9333ea', '#f59e0b', '#3b82f6', '#ec4899', '#10b981'],
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
              }
            }
          });
        } catch (chartError) {
          console.error("Lỗi hiển thị biểu đồ:", chartError);
        }
      });
    },

    async changeSummaryPage(step) {
      const target = this.summaryPagination.page + step;
      if (target >= 1 && target <= this.totalSummaryPages) {
        this.summaryPagination.page = target;
        this.isLoading = true;
        await this.fetchSummaryTable(); 
        this.isLoading = false;
      }
    },

    async changeDetailPage(step) {
      const target = this.detailPagination.page + step;
      if (target >= 1 && target <= this.totalDetailPages) {
        this.detailPagination.page = target;
        this.isLoading = true;
        await this.fetchDetailTable(); 
        this.isLoading = false;
      }
    },

    handleAdminChange() {
      this.selectedDateFilter = 'ALL';
      this.summaryPagination.page = 1;
      this.detailPagination.page = 1;
      this.loadAllDashboardData();
    },

    handleMonthChange() {
      this.selectedDateFilter = 'ALL';
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
    },

    async handleLogout() {
      await _supabase.auth.signOut();
      if (this.chartInstance) this.chartInstance.destroy();
      this.user = null;
      this.currentScreen = 'login';
    }
  }
}).mount('#app');
