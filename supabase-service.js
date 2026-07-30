const SupabaseService = {

    async getSession() {
        return await _supabase.auth.getSession();
    },

    async signIn(email, password) {
        return await _supabase.auth.signInWithPassword({
            email,
            password
        });
    },

    async signUp(email, password) {
        return await _supabase.auth.signUp({
            email,
            password
        });
    },

    async signOut() {
        return await _supabase.auth.signOut();
    },

    async getProfile(uuid) {
        return await _supabase
            .from("user_profiles")
            .select("user_id, employee_name, is_admin")
            .eq("id", uuid)
            .single();
    },

    async saveProfile(profile) {
        return await _supabase
            .from("user_profiles")
            .upsert(profile, {
                onConflict: "id"
            });
    },

    async getEmployees() {
        return await _supabase
            .from("user_profiles")
            .select("employee_name");
    },

    async getProductivity(queryBuilder) {
        return await queryBuilder;
    }

};
