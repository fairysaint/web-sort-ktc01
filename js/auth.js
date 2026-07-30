// ======================================
// Authentication Methods
// ======================================

const AuthMethods = {

    // ==========================
    // Kiểm tra Session
    // ==========================
    async checkCurrentSession() {

        const {
            data: { session }
        } = await _supabase.auth.getSession();

        if (session && session.user) {

            await this.getUserProfile(session.user.id);

        } else {

            this.currentScreen = "login";

        }

    },

    // ==========================
    // Đăng nhập / Đăng ký
    // ==========================
    async handleAuth() {

        if (
            Utils.isEmpty(this.authForm.userId) ||
            Utils.isEmpty(this.authForm.password)
        ) {

            alert("Vui lòng nhập đầy đủ thông tin.");

            return;

        }

        if (this.authForm.password.length < 6) {

            alert("Mật khẩu phải có ít nhất 6 ký tự.");

            return;

        }

        const userId = Utils.cleanString(this.authForm.userId);

        const email =
            userId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() +
            "@nangsuat.local";

        this.isLoading = true;

        try {

            //=========================
            // ĐĂNG KÝ
            //=========================
            if (this.authForm.isRegister) {

                if (Utils.isEmpty(this.authForm.employeeName)) {

                    alert("Vui lòng nhập Họ và Tên.");

                    this.isLoading = false;

                    return;

                }

                const {
                    data,
                    error
                } = await _supabase.auth.signUp({

                    email: email,

                    password: this.authForm.password

                });

                if (error) {

                    if (
                        error.message.includes("User already registered")
                    ) {

                        alert("Mã nhân viên đã tồn tại.");

                    } else {

                        alert(error.message);

                    }

                    return;

                }

                const { error: profileError } =
                    await _supabase
                        .from("user_profiles")
                        .upsert({

                            id: data.user.id,

                            user_id: userId,

                            employee_name:
                                Utils.cleanString(
                                    this.authForm.employeeName
                                ),

                            is_admin: false

                        }, {

                            onConflict: "id"

                        });

                if (profileError) {

                    alert(profileError.message);

                    return;

                }

                alert("Đăng ký thành công.");

                this.authForm.isRegister = false;

                this.authForm.password = "";

                return;

            }

            //=========================
            // ĐĂNG NHẬP
            //=========================
            const {
                data,
                error
            } =
                await _supabase.auth.signInWithPassword({

                    email,

                    password: this.authForm.password

                });

            if (error) {

                alert("Sai tài khoản hoặc mật khẩu.");

                return;

            }

            await this.getUserProfile(data.user.id);

        }

        catch (err) {

            console.error(err);

            alert("Có lỗi xảy ra.");

        }

        finally {

            this.isLoading = false;

        }

    },

    // ==========================
    // Lấy Profile
    // ==========================
    async getUserProfile(uuid) {

        const {
            data,
            error
        } =
            await _supabase
                .from("user_profiles")
                .select(
                    "user_id, employee_name, is_admin"
                )
                .eq("id", uuid)
                .single();

        if (error) {

            alert(error.message);

            return;

        }

        this.user = data;

        this.currentScreen = "dashboard";

        await this.fetchFilterOptions();

        await this.loadAllDashboardData();

    },

    // ==========================
    // Đăng xuất
    // ==========================
    async handleLogout() {

        await _supabase.auth.signOut();

        if (this.chartInstance) {

            this.chartInstance.destroy();

        }

        this.user = null;

        this.summaryList = [];

        this.detailList = [];

        this.currentScreen = "login";

    }

};
