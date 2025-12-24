-- Create the messages table
create table messages (
  id bigint primary key generated always as identity,
  content text,
  sender text,
  type text default 'text',
  file_url text,
  file_name text,
  file_size text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Realtime for this table
alter publication supabase_realtime add table messages;

-- (Optional) Create a storage bucket for files if you plan to implement file uploads later
-- insert into storage.buckets (id, name) values ('chat-files', 'chat-files');
