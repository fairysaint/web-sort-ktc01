// ======================================
// Authentication Methods
// ======================================

const AuthMethods = {

    // ======================================
    // Kiểm tra phiên đăng nhập
    // ======================================
    async checkCurrentSession() {

        const { data: { session } } =
            await _supabase.auth.getSession();

        if (session && session.user) {

            await this.getUserProfile(session.user.id);

        } else {

            this.currentScreen = "login";

        }

    },

    // ======================================
    // Đăng nhập / Đăng ký
    // ======================================
    async handleAuth() {

        if (
            !this.authForm.userId ||
            !this.authForm.password
        ) {

            alert("Vui lòng nhập đầy đủ Mã nhân viên và Mật khẩu.");

            return;

        }

        if (this.authForm.password.length < 6) {

            alert("Mật khẩu phải có ít nhất 6 ký tự.");

            return;

        }

        const userId = this.authForm.userId.trim();

        const emailFake =
            `${userId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}@nangsuat.local`;

        this.isLoading = true;

        try {

            // ===========================
            // ĐĂNG KÝ
            // ===========================
            if (this.authForm.isRegister) {

                if (!this.authForm.employeeName.trim()) {

                    alert("Vui lòng nhập Họ và tên.");

                    this.isLoading = false;

                    return;

                }

                const { data, error } =
                    await _supabase.auth.signUp({

                        email: emailFake,

                        password: this.authForm.password

                    });

                if (error) {

                    if (
                        error.message.includes(
                            "User already registered"
                        )
                    ) {

                        alert("Mã nhân viên đã tồn tại.");

                    } else {

                        alert(error.message);

                    }

                    this.isLoading = false;

                    return;

                }

                if (data.user) {

                    const { error: profileError } =
                        await _supabase
                            .from("user_profiles")
                            .upsert(
                                {

                                    id: data.user.id,

                                    user_id: userId,

                                    employee_name:
                                        this.authForm.employeeName.trim(),

                                    is_admin: false

                                },
                                {
                                    onConflict: "id"
                                }
                            );

                    if (profileError) {

                        alert(profileError.message);

                        this.isLoading = false;

                        return;

                    }

                    alert("Đăng ký thành công.");

                    this.authForm.isRegister = false;

                    this.authForm.password = "";

                }

            }

            // ===========================
            // ĐĂNG NHẬP
            // ===========================
            else {

                const { data, error } =
                    await _supabase.auth.signInWithPassword({

                        email: emailFake,

                        password: this.authForm.password

                    });

                if (error) {

                    alert("Sai mã nhân viên hoặc mật khẩu.");

                    this.isLoading = false;

                    return;

                }

                await this.getUserProfile(
                    data.user.id
                );

            }

        } catch (err) {

            console.error(err);

            alert("Có lỗi xảy ra.");

        }

        finally {

            this.isLoading = false;

        }

    },

    // ======================================
    // Lấy Profile
    // ======================================
    async getUserProfile(uuid) {

        const { data, error } =
            await _supabase
                .from("user_profiles")
                .select(
                    "user_id, employee_name, is_admin"
                )
                .eq("id", uuid)
                .single();

        if (error || !data) {

            alert("Không tìm thấy hồ sơ.");

            return;

        }

        this.user = data;

        this.currentScreen = "dashboard";

        await this.fetchFilterOptions();

        await this.loadAllDashboardData();

    },

    // ======================================
    // Đăng xuất
    // ======================================
    async handleLogout() {

        await _supabase.auth.signOut();

        if (this.chartInstance) {

            this.chartInstance.destroy();

            this.chartInstance = null;

        }

        this.user = null;

        this.currentScreen = "login";

    }

};
