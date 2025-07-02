
-- Create chat_messages table for live chat functionality
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  sender_name text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_messages
CREATE POLICY "Users can view their own messages" 
  ON public.chat_messages 
  FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" 
  ON public.chat_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- Add expertise column to profiles table for mitra
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS expertise text;

-- Add transfer_proof column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS transfer_proof text;

-- Update profiles table to match the application structure
ALTER TABLE public.profiles 
ALTER COLUMN balance SET DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_participants 
ON public.chat_messages (sender_id, receiver_id, created_at);

CREATE INDEX IF NOT EXISTS idx_orders_user_id 
ON public.orders (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_orders_mitra_id 
ON public.orders (mitra_id, created_at);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id 
ON public.transactions (user_id, created_at);
