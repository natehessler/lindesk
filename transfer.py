import sys
import os

ticket_num = sys.argv[1]
og_ticket_path = os.path.join("./resolved-tickets", "%s.md" % (ticket_num))

paths = [
    "./converted", 
    "./converted/text", 
    "./converted/json", 
    "./converted/tmp" 
]

for path in paths:
    os.mkdir(path)



with open(og_ticket_path, "r", encoding="utf-8-sig") as f:  
    lines = []
    for line in f:
        print(line, end="")
        # lines.append(f.readline())

print(lines)

# print(data)

# with open("%s.txt" % (ticket_num), 'w') as fp:




