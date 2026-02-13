-- SBK Tutor Intelligence System - Final Schema Sync & Seed
-- 1. CLEANUP LEGACY COLUMNS (Removing the old 'options' array and 'correct_option_index')
DO $$ 
BEGIN 
    -- Remove the old columns that are causing the NOT NULL violations
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='options') THEN
        ALTER TABLE public.questions DROP COLUMN options;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='correct_option_index') THEN
        ALTER TABLE public.questions DROP COLUMN correct_option_index;
    END IF;

    -- Ensure Categories has 'published'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='published') THEN
        ALTER TABLE public.categories ADD COLUMN published BOOLEAN DEFAULT false;
    END IF;

    -- Ensure Questions has v2 columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='option_a') THEN
        ALTER TABLE public.questions ADD COLUMN option_a TEXT;
        ALTER TABLE public.questions ADD COLUMN option_b TEXT;
        ALTER TABLE public.questions ADD COLUMN option_c TEXT;
        ALTER TABLE public.questions ADD COLUMN option_d TEXT;
        ALTER TABLE public.questions ADD COLUMN correct_option TEXT;
        ALTER TABLE public.questions ADD COLUMN explanation TEXT;
    END IF;
END $$;

-- 2. CLEAR AND SEED
DO $$
DECLARE
    platform_id UUID;
    field_id UUID;
    html_id UUID;
    scratch_id UUID;
    foundations_id UUID;
    robotics_id UUID;
    culture_id UUID;
BEGIN
    -- Delete existing to avoid duplicates if re-running
    DELETE FROM public.questions;
    DELETE FROM public.categories;

    -- Insert Categories
    INSERT INTO public.categories (name, description, published)
    VALUES ('Platform Operations Test', 'Internal systems, login protocols, and learner portal management.', true)
    RETURNING id INTO platform_id;

    INSERT INTO public.categories (name, description, published)
    VALUES ('Field Operations Test', 'On-site classroom management, crisis response, and stakeholder relations.', true)
    RETURNING id INTO field_id;

    INSERT INTO public.categories (name, description, published)
    VALUES ('HTML Curriculum Test', 'Web development pedagogy and technical concepts for K-12.', true)
    RETURNING id INTO html_id;

    INSERT INTO public.categories (name, description, published)
    VALUES ('Scratch Curriculum Test', 'Visual block-based programming and logical thinking.', true)
    RETURNING id INTO scratch_id;

    INSERT INTO public.categories (name, description, published)
    VALUES ('Foundations Curriculum Test', 'Computer basics, digital literacy, and computational thinking.', true)
    RETURNING id INTO foundations_id;

    INSERT INTO public.categories (name, description, published)
    VALUES ('Robotics Test', 'Hardware components, circuit logic, and mechanical engineering.', true)
    RETURNING id INTO robotics_id;

    INSERT INTO public.categories (name, description, published)
    VALUES ('Company Culture Test', 'SBK values, professional ethics, and communication standards.', true)
    RETURNING id INTO culture_id;

    -- Platform Questions
    INSERT INTO public.questions (category_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
    VALUES (platform_id, 'A tutor cannot log in to the SBK Portal. What is the first validation step?', 'Reset the router', 'Verify the email ends with @smartbrainskenya.com', 'Call the CEO', 'Use a personal Gmail account', 'B', 'All internal staff must use the official company domain for authentication.');

    INSERT INTO public.questions (category_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
    VALUES (platform_id, 'When entering a school code, the system returns "Invalid Session". What is the most likely cause?', 'The school has no computers', 'The code is case-sensitive and must be uppercase', 'The school has not paid', 'The tutor email is wrong', 'B', 'School codes are strict and must be entered exactly as provided in the operations manual.');

    INSERT INTO public.questions (category_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
    VALUES (platform_id, 'A tutor dashboard shows "No Active Class" during a scheduled session. Why?', 'The internet is too slow', 'The session start time is more than 15 minutes away', 'The students are all absent', 'The school code was not entered', 'B', 'Classes only appear active on the dashboard 15 minutes before the scheduled start time.');

    INSERT INTO public.questions (category_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
    VALUES (platform_id, 'How does a student reset their password on the SBK Learner platform?', 'Via an automated email link', 'The tutor resets it via the Tutor Control Panel', 'Contacting SBK Support directly', 'Students cannot reset passwords', 'B', 'Tutors have the authority to reset student passwords directly from their management dashboard.');

    INSERT INTO public.questions (category_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
    VALUES (platform_id, 'A student failed a module quiz and wants to retry immediately. What is the logic?', 'They can retry infinitely', 'The tutor must manually "Unlock Retry" in the portal', 'They must wait 24 hours', 'They must start the whole course again', 'B', 'To prevent guessing, the portal locks retries until the tutor verifies the student has reviewed the content.');

    -- Field Ops Questions
    INSERT INTO public.questions (category_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
    VALUES (field_id, 'The school internet goes down 10 minutes into a coding session. What is the protocol?', 'Cancel class and go home', 'Use a personal phone hotspot for all 30 laptops', 'Switch to "Unplugged" offline curriculum activities', 'Wait for the internet to return', 'C', 'SBK provides unplugged activities for every module to ensure learning continues during technical outages.');

    INSERT INTO public.questions (category_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
    VALUES (field_id, 'A school assembly runs over, and you start class 20 minutes late. How do you handle the end time?', 'Extend the class by 20 minutes', 'Compress the core content and finish at the scheduled time', 'Skip the lesson and play games', 'Complain to the Principal', 'B', 'We must respect school schedules. Compressing content ensures we don''t disrupt the next teacher''s lesson.');

    INSERT INTO public.questions (category_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
    VALUES (field_id, 'A parent approaches you at the school gate complaining about their child''s slow progress. What is the correct response?', 'Argue that the child is lazy', 'Refer the parent to the SBK Head Office or Lead Tutor', 'Promise a 100% score next time', 'Ignore the parent', 'B', 'Tutors should remain professional and refer specific parent concerns to management.');

    INSERT INTO public.questions (category_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
    VALUES (field_id, 'A student accidentally drops and cracks a laptop screen. What is the immediate action?', 'Hide the laptop in the bag', 'Demand money from the student', 'Report to the school IT rep and SBK Operations via the damage form', 'Fix it with tape', 'C', 'Accidents must be documented immediately via the official damage report.');

    INSERT INTO public.questions (category_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
    VALUES (field_id, 'The school register shows 25 students, but only 20 appear in your portal. What do you do?', 'Mark the extra 5 as "Guest" and report the discrepancy to Ops', 'Refuse to teach the extra 5', 'Delete the 5 from the school register', 'Ignore the discrepancy', 'A', 'We never turn away a student in class; we teach them and resolve the registration error with Operations afterward.');

END $$;
