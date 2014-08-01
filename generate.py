import nltk
from nltk import word_tokenize

from collections import defaultdict
from os import listdir
from os.path import isfile, join
import pickle
from random import choice


def get_defaultdictint():
    return defaultdict(int)

def get_defaultdict():
    return defaultdict(get_defaultdictint)

ngrams = [3,4,5]

letters = set('AHIJLMNTUVYW '.lower())

try:
    model = pickle.load( open( "model.pickle", "rb" ) )
except:
    def ngram(words, n):
        if len(words) < n:
            return
        for i in range(len(words) - (n-1)):
            yield [w.lower() for w in words[i:i+n]]

    model = defaultdict(get_defaultdict)
    directory = 'guten/unzipped'
    for f in [ f for f in listdir(directory) if isfile(join(directory,f))]:
        with open(join(directory,f)) as w:
            print f
            for n in ngrams:
                for words in ngram(nltk.PunktWordTokenizer().tokenize(w.read().decode("latin-1")), n):
                    if set(''.join(words)).issubset(letters):
                        model[n][tuple(words[:-1])][words[-1]] +=1
    pickle.dump(model, open( "model.pickle", "wb" ))

def expand_model(d):
    result = []
    for k in d:
        result.extend([k] * d[k])
    return result


def random_sentence(n):
    def sentence(words, tup, max=45):
        if len(words) > 45 or tup not in model[n]:
            return words
        rand = choice(expand_model(model[n][tup]))
        return sentence(words + ' ' + rand, tuple(list(tup[1:]) + [rand]))
    start = choice(model[n].keys())
    return sentence(' '.join(start), start)

for i in range(100):
    print random_sentence(3)
