"use client";

import { User } from "@supabase/supabase-js";

type EmailPasswordProp = {
    user: User | null;
};

export default function EmailPassword({ user } : EmailPasswordProp) {
    return (
        <div>
            <h1>Email Password Authentication</h1>
        </div>
    );
}
