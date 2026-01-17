import { create } from "domain";
import EmailPassword from "./EmailPassword";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export default async function EmailPasswordPage() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return <EmailPassword user={null} />;
}