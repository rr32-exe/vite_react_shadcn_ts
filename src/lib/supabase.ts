import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://awhyajamokxzhmjlzytt.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImQ4NjkwYjg4LThkNDAtNDlmMS04N2ExLWE3NTE2NjllYzUyOSJ9.eyJwcm9qZWN0SWQiOiJhd2h5YWphbW9reHpobWpsenl0dCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY4MTMwMTc2LCJleHAiOjIwODM0OTAxNzYsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.GdGflz8e6cMao1EF_Whlp6N5qkx5mDgkjYD2tGlxGpQ';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };