from bs4 import BeautifulSoup
import urllib2
import string

class Spec(object):
	host = ''
	filename = ''
	links = []
	selectors = []
	max = 1000

	def __init__(self):
		self.links.append(self.host)

	def go(self):
		pos = 0
		results = []
		while pos < len(self.links) and pos < self.max:
			try:
				html = urllib2.urlopen(self.links[pos]).read()
				soup = BeautifulSoup(html)
				count = 0
				for link in soup.find_all('a'):
					href = link.get('href')
					if href:
						if href.startswith('/'):
							href = self.host + href
						if href not in self.links and href.startswith(self.host):
							self.links.append(href)
							count += 1
				print 'Found %d pages' % count
				for selector in self.selectors:
					for headline in soup.select(selector):
						text = filter(lambda x: x in string.printable, headline.text.strip()).replace('\n', ' ')
						if text not in results:
							results.append(text)
				print results
				with open(self.filename, 'w') as f:
					f.write('\n'.join(results))
				print pos
			except:
				pass
			pos += 1


class Herald(Spec):
	host = 'http://www.nzherald.co.nz'
	filename = 'herald.txt'
	links = []
	selectors = ['h1', 'h3']
	max = 1000

class Stuff(Spec):
	host = 'http://www.stuff.co.nz'
	filename = 'stuff.txt'
	links = []
	selectors = ['h1', 'h2']
	max = 1000

class NYTimes(Spec):
	host = 'http://www.nytimes.com'
	filename = 'nytimes.txt'
	links = []
	selectors = ['h1', 'h2 a']
	max = 1000


#Herald().go()

#Stuff().go()

NYTimes().go()