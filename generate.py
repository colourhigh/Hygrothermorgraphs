import nltk
from nltk import word_tokenize

from collections import defaultdict
from os import listdir
from os.path import isfile, join
import pickle
from itertools import permutations
from random import choice

with open('word_list.txt') as w:
    word_list = nltk.PunktWordTokenizer().tokenize(w.read().decode("utf-8"))
word_set = set(word_list)
n = 4
try:
    model  = pickle.load( open( "model.pickle", "rb" ) )
except:
    def ngram(words, n):
        if len(words) < n:
            return
        for i in range(len(words) - (n-1)):
            yield words[i:i+n]

    model = defaultdict(list)
    directory = 'guten/unzipped'
    for f in [ f for f in listdir(directory) if isfile(join(directory,f)) ]:
        with open(join(directory,f)) as w:
            print f
            for words in ngram(nltk.PunktWordTokenizer().tokenize(w.read().decode("latin-1")), n):
                if len(word_set.intersection(words)) == n:
                    model[tuple(words[:-1])].append(words[-1])
    pickle.dump(model, open( "model.pickle", "wb" ) )


def random_sentence():
    def sentence(words, tup, max=45):
        if len(words) > 45 or tup not in model:
            return words
        rand = choice(model[tup])
        return sentence(words + ' ' + rand, tuple(list(tup[1:]) + [rand]))
    start = choice(model.keys())
    return sentence(' '.join(start), start)

for i in range(100):
    print random_sentence()
