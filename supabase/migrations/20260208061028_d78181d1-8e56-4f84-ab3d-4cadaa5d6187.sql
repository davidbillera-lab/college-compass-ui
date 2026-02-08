-- Create college_lists table for organizing colleges into custom groups
CREATE TABLE public.college_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create college_list_items table for list membership
CREATE TABLE public.college_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.college_lists(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(list_id, college_id)
);

-- Enable RLS
ALTER TABLE public.college_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_list_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for college_lists
CREATE POLICY "Users can view own lists" ON public.college_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own lists" ON public.college_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lists" ON public.college_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lists" ON public.college_lists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for college_list_items (through list ownership)
CREATE POLICY "Users can view items in own lists" ON public.college_list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.college_lists 
      WHERE id = college_list_items.list_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add items to own lists" ON public.college_list_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.college_lists 
      WHERE id = college_list_items.list_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in own lists" ON public.college_list_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.college_lists 
      WHERE id = college_list_items.list_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from own lists" ON public.college_list_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.college_lists 
      WHERE id = college_list_items.list_id 
      AND user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_college_lists_updated_at
  BEFORE UPDATE ON public.college_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();