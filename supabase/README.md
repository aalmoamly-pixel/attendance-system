# Supabase Database Setup

## 🚀 Quick Setup

### Option 1: Using the SQL Editor (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `kvceksrtlqdnrhkzshqp`
3. Go to the **SQL Editor** from the sidebar
4. Click **New Query**
5. Copy the contents of `002_complete_schema.sql`
6. Paste it into the SQL Editor
7. Click **Run** (▶️)
8. Wait for the query to complete - your database is ready!

### Option 2: Using the CLI

If you have the Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref kvceksrtlqdnrhkzshqp

# Run migrations
supabase db push
```

## 📋 What the Script Does

This migration script:

1. **Drops existing tables** (clean start) - safely
2. **Creates all tables** in the correct order:
   - departments
   - students
   - subjects
   - weekdays
   - time_slots
   - student_schedule
   - attendance_logs

3. **Creates indexes** for better performance
4. **Inserts default data**:
   - 7 weekdays (الأحد to السبت)
   - 2 time slots (4-7 PM, 7-10 PM)
   - Default department
   - 5 default subjects

5. **Enables RLS (Row Level Security)** with proper policies
6. **Adds tables to Realtime** for live updates

## 📁 File Structure

```
supabase/
├── migrations/
│   ├── 001_fix_schedule_import.sql    # Fix for import conflicts
│   └── 002_complete_schema.sql        # Full database schema (RECOMMENDED)
└── README.md                          # This file
```

## 🔑 Important Notes

- **Use `002_complete_schema.sql` for fresh installations** - it sets up everything from scratch
- The script is **safe to run multiple times** - it drops tables first
- Your existing data will be **deleted** when running this script
- Always back up your data before running migrations

## 🎯 After Setup

Once the database is ready, your application should work perfectly! The "Perfect Schedule" button will now work without conflicts.

## 🛠️ Troubleshooting

If you get permission errors:

1. Go to Supabase Dashboard → Authentication → Policies
2. Make sure your policies allow read/write access
3. Or just run the complete schema script again

If you have duplicate key errors:

1. The complete schema script drops all tables first, so this shouldn't happen
2. If it does, go to Table Editor and delete records manually

## 📞 Support

Need help? Check the Supabase docs: https://supabase.com/docs
