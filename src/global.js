export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
export const HASH_KEY = import.meta.env.VITE_SECRET_HASH_KEY;

// libraries
import { createClient } from '@supabase/supabase-js';
import { writable, readable, get } from 'svelte/store';

// supabase
const supabaseURL = 'https://sgocnrgwrtdruxnxpxyl.supabase.co';
export const supabase = createClient(supabaseURL, SUPABASE_KEY);

// global objects
export const global_hasAccount = writable(false);
export const global_account = writable();
export const global_account_data = writable();
export const global_posts = writable();
export const global_mod_account = writable();

export const _blogs = readable(null, (set) => {
	supabase
		.from('posts')
		.select('*')
		.order('created_at', { ascending: false })
		.then(({ data, error }) => {
			set(data);
		});

	const subscription = supabase
		.from('posts')
		.on('*', async () => {
			let { data, error } = await supabase
				.from('posts')
				.select('*')
				.order('created_at', { ascending: false });
			if (!error) {
				set(data);
			}

			// if (payload.eventType == 'INSERT') {
			// 	set([payload.new, ...get(_blogs)]);
			// }
			// if (payload.eventType === 'UPDATE') {
			// 	let index = get(_blogs).findIndex((thisblog) => thisblog.id === payload.new.id);
			// 	let oldData = get(_blogs);
			// 	oldData[index] = payload.new;

			// 	set(oldData);
			// }
			// if (payload.eventType == 'DELETE') {
			// 	let newData = get(_blogs).filter((thisItem) => thisItem.id != payload.old.id);
			// 	set(newData);
			// }
		})
		.subscribe();

	return () => supabase.removeSubscription(subscription);
});
