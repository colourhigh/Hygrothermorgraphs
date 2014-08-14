from bs4 import BeautifulSoup
import requests
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
				res = requests.get(self.links[pos])
				soup = BeautifulSoup(res.text)
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
				with open(self.title_filename, 'w') as f:
					f.write('\n'.join(results))
				body = []
				for b in soup.select(self.body_selector):
					text= filter(lambda x: x in string.printable, b.text)
					body.append(text)

				if len(body):
					with open(self.body_filename, 'a') as f:
						f.write('\n'.join(body))
				print pos
			except Exception, e:
				print e
			pos += 1


class Herald(Spec):
	host = 'http://www.nzherald.co.nz'
	title_filename = 'herald.txt'
	body_filename = 'herald_body.txt'
	links = []
	selectors = ['h1', 'h3']
	body_selector = '.articleBody p'
	max =300

class Stuff(Spec):
	host = 'http://www.stuff.co.nz'
	title_filename = 'stuff.txt'
	body_filename = 'stuff_body.txt'
	links = []
	selectors = ['h1', 'h2']
	body_selector = '#left_col p'
	max = 300

class NYTimes(Spec):
	host = 'http://www.nytimes.com'
	title_filename = 'nytimes.txt'
	body_filename = 'nytimes_body.txt'
	links = []
	selectors = ['h1', 'h2 a']
	body_selector = '.story-content'
	max = 300

class Guardian(Spec):
	host = 'http://www.theguardian.com/uk'
	title_filename = 'guardian.txt'
	body_filename = 'guardian_body.txt'
	links = []
	selectors = ['h1', 'bullet a']
	body_selector = '#article-body-blocks p'
	max = 300

#Guardian().go()
Herald().go()

Stuff().go()

NYTimes().go()
