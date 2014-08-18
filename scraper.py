from bs4 import BeautifulSoup
import requests
import string
from textblob import TextBlob
import nltk
from nltk import word_tokenize
from collections import defaultdict
import json
from pymongo import MongoClient
from random import choice
import datetime

client = MongoClient()

db = client['hygrothermographs']

def get_defaultdictint():
    return defaultdict(int)

def get_defaultdict():
    return defaultdict(get_defaultdictint)

letters = set('AHIJLMNTUVYW '.lower())
ngrams = [3,4,5]


def ngram(words, n):
    if len(words) < n:
        return
    for i in range(len(words) - (n-1)):
        yield [w.lower() for w in words[i:i+n]]


class Encoder(json.JSONEncoder):
    def default(self, obj):
        print obj
        if isinstance(obj, defaultdict):
            return dict(obj)
        return obj


class Spec(object):
    host = ''
    links = []
    selectors = []
    max = 300

    def __init__(self):
        self.links.append(self.host)

    def go(self):
        pos = 0
        self.titles = []
        self.bodies = []
        while pos < len(self.links) and pos < self.max:
            try:
                res = requests.get(self.links[pos])
                soup = BeautifulSoup(res.text)
                count = 0
                for link in soup.select(self.link_selectors):
                    href = link.get('href')
                    if href:
                        if href.startswith('/'):
                            href = self.host + href
                        if href not in self.links and href.startswith(self.host):
                            self.links.append(href)
                            count += 1
                for selector in self.selectors:
                    for headline in soup.select(selector):
                        text = filter(lambda x: x in string.printable, headline.text.strip()).replace('\n', ' ')
                        self.titles.append(text)
                for b in soup.select(self.body_selector):
                    text= filter(lambda x: x in string.printable, b.text)
                    self.bodies.append(text)
                print pos
            except Exception, e:
                print e
            pos += 1
        self.parse()

    def parse(self):
        text = filter(lambda x: x in string.printable, ' '.join(self.bodies))
        #blob = TextBlob(text)
        model = defaultdict(get_defaultdict)
        for n in ngrams:
            for words in ngram(nltk.PunktWordTokenizer().tokenize(text), n):
                if set(''.join(words)).issubset(letters):
                    model[n][tuple(words[:-1])][words[-1]] +=1
        self.generate(model)


    def generate(self, model):
        n = 3
        max = 45
        results = []
        def expand_model(d):
            result = []
            for k in d:
                result.extend([k] * d[k])
            return result

        def random_sentence(n):
            def sentence(words, tup, max):
                if len(words) > max or tup not in model[n]:
                    return words
                rand = choice(expand_model(model[n][tup]))
                return sentence(words + ' ' + rand, tuple(list(tup[1:]) + [rand]), max)
            start = choice(model[n].keys())
            return sentence(' '.join(start), start, max)

        if len(model[n].keys()):
            for i in range(100):
                results.append(random_sentence(n))
            self.save(set(results))

    def save(self, data):
        post = {
            "name": self.name,
            "trigrams": list(data),
            "date": datetime.datetime.utcnow()
        }
        db.scrapings.insert(post)


class Herald(Spec):
    name = 'Herald'
    host = 'http://www.nzherald.co.nz'
    link_selectors = 'h2 a, h3 a'
    selectors = ['h1', 'h3']
    body_selector = '#articleBody p'

class Stuff(Spec):
    name = 'Stuff.co.nz'
    host = 'http://www.stuff.co.nz'
    link_selectors = 'h2 a, h3 a'
    selectors = ['h1', 'h2']
    body_selector = '#left_col p'

class NYTimes(Spec):
    name = 'NYTimes'
    host = 'http://www.nytimes.com'
    link_selectors = 'h1 a, h2 a'
    selectors = ['h1', 'h2 a']
    body_selector = '.story-content'

class Guardian(Spec):
    name = 'Guardian'
    host = 'http://www.theguardian.com/world'
    link_selectors = 'h1 a, h3 a'
    selectors = ['h1', 'h3 a']
    body_selector = '#article-body-blocks p'

class WashingtonPost(Spec):
    name = 'Washington Post'
    host = 'http://www.washingtonpost.com/'
    link_selectors = 'h1 a, h2 a, .normal a'
    selectors = ['h2']
    body_selector = '#article-body p'


WashingtonPost().go()
Guardian().go()
Herald().go()
Stuff().go()
NYTimes().go()

