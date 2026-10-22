import re, os

files = [
    "src/pages/super-admin/SystemAnalytics.jsx",
    "src/pages/super-admin/TiersAndFeatures.jsx",
    "src/pages/super-admin/Plans.jsx",
    "src/pages/super-admin/Broadcast.jsx",
    "src/pages/super-admin/Settings.jsx",
    "src/pages/super-admin/AuditLogs.jsx"
]

for filepath in files:
    if not os.path.exists(filepath):
        print(f"⚠️ File not found: {filepath}")
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # 1. Remove the import statement
    content = re.sub(r"import\s+PageHeader\s+from\s+['\"].*?['\"];?\n?", "", content)
    
    # 2. Remove the <PageHeader ... /> component (handles multi-line)
    content = re.sub(r"<PageHeader[\s\S]*?/>\s*\n?", "", content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"✅ Cleaned {filepath}")

print("🎉 All headers removed safely!")
