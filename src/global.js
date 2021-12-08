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
		})
		.subscribe();

	return () => supabase.removeSubscription(subscription);
});

export const _user = readable(supabase.auth.user(), (set) => {
	if (supabase.auth.user()) {
		supabase
			.from('users')
			.select('*')
			.eq('id', supabase.auth.user().id)
			.then(({ data, error }) => {
				_userData.set(data[0]);
			});
	}
	supabase.auth.onAuthStateChange((event, session) => {
		if (event == 'SIGNED_IN') {
			supabase
				.from('users')
				.select('*')
				.eq('id', supabase.auth.user().id)
				.then(({ data, error }) => {
					_userData.set(data[0]);
				});
			set(session.user);
		}
		if (event == 'SIGNED_OUT') {
			_userData.set('');
			set(null);
		}
	});
});
export const _userData = writable();
