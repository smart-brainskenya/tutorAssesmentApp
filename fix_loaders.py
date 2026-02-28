import re
import os

files_to_fix = [
    "src/pages/tutor/Results.tsx",
    "src/pages/admin/ReviewQueue.tsx",
    "src/pages/admin/Analytics.tsx",
    "src/pages/admin/Tutors.tsx"
]

for file_path in files_to_fix:
    with open(file_path, "r") as f:
        content = f.read()

    # Let's replace the whole block `if (loading) return (...)`

    # Matches patterns like:
    # if (loading) return (
    #   <div ...>
    #     <div className="animate-spin ..."></div>
    #     <p ...>...</p> (optional if deleted)
    #   </div>
    # );

    # Or Analytics which is:
    # if (loading) return (
    #   <div className="flex flex-col justify-center items-center py-20 gap-4">
    #     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sbk-blue"></div>
    #   </div>
    # );

    pattern = r"if\s*\(loading\)\s*return\s*\(\s*<div[^>]*>[\s\S]*?animate-spin[\s\S]*?<\/div>\s*\)\s*;"

    new_content = re.sub(pattern, "if (loading) return <LoadingSpinner />;", content)

    # Also fix any missed `if (loading)` blocks that might be slightly different
    # e.g., missing return parens
    pattern2 = r"if\s*\(loading\)\s*\{\s*return\s*\(\s*<div[^>]*>[\s\S]*?animate-spin[\s\S]*?<\/div>\s*\)\s*;\s*\}"
    new_content = re.sub(pattern2, "if (loading) { return <LoadingSpinner />; }", new_content)

    with open(file_path, "w") as f:
        f.write(new_content)
