import sys

filepath = r'c:\Users\luis.sarabia\MenuPro\frontend\src\pages\dashboard\ConfiguracionPage.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ('className="hidden md:table-cell px-8 py-4"', 'className="hidden md:table-cell px-6 py-4"'),
    ('className="px-4 md:px-6 py-4"', 'className="px-4 md:px-5 py-4"'),
    ('className="hidden lg:table-cell px-6 py-4"', 'className="hidden lg:table-cell px-4 py-4"'),
    ('className="hidden md:table-cell px-6 py-4"', 'className="hidden md:table-cell px-4 py-4"'),
    ('className="px-4 md:px-8 py-4', 'className="px-4 md:px-6 py-4'),
]

for old, new in replacements:
    content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied replacements successfully.")
