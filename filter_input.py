"""find . -type f  | xargs cat |  perl -pe 's/<(?:([^>]*"[^"]*")+[^>]*|[^>]+)>/ /g' | perl -pe 's/ +/ /g' """
import sys
letters = set('AHIJLMNTUVYW '.lower())
threshold = 13
data = sys.stdin.read().lower()
i = 0
j= 0
results = []
while i < len(data) and j <= len(data):
	if not len(set(data[i:j]).difference(letters)):
		if j -i > threshold:
			results.append(data[i:j])
		j += 1
	else:
		i += 1
		j = i + 1
print set(results)