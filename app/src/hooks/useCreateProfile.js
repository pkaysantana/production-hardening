// src/hooks/useCreateProfile.js
import { useEffect } from 'react'
import { getSupabase } from '../lib/supabase'

export function useCreateProfile() {
    const supabase = getSupabase()

    useEffect(() => {
        const run = async () => {
            const { data } = await supabase.auth.getUser()
            const user = data.user
            if (!user) return

            await supabase.from('profiles').upsert({
                id: user.id,
                email: user.email,
            })
        }

        run()
    }, [])
}