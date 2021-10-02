export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY
export const HASH_KEY = import.meta.env.VITE_SECRET_HASH_KEY

// libraries
import {createClient} from '@supabase/supabase-js'
import { writable } from 'svelte/store'

// supabase
const supabaseURL ='https://sgocnrgwrtdruxnxpxyl.supabase.co'
export const supabase = createClient(supabaseURL, SUPABASE_KEY)

// global objects
export const global_hasAccount = writable(false)
export const global_account = writable();
export const global_posts = writable()
export const global_mod_account = writable()
export const edit_selectedID = writable('')