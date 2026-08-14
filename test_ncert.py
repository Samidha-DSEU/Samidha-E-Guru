import requests, re
resp = requests.get('https://ncert.nic.in/textbook.php')
book_pattern = re.compile(r'document\.test\.tbook\.options\[\d+\]\.text\s*=\s*[\"\']([^\"\']+)[\"\'];.*?document\.test\.tbook\.options\[\d+\]\.value\s*=\s*[\"\']textbook\.php\?([^=]+)=([^\"\']+)[\"\']', re.DOTALL)
matches = book_pattern.findall(resp.text)
for m in matches:
    if "Mridang" in m[0] or "Joyful" in m[0]:
        print(m)
