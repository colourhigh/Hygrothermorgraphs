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

try:
    model  = pickle.load( open( "model.pickle", "rb" ) )
except:
    def trigram(words):
        if len(words) < 3:
            return
        for i in range(len(words) - 2):
            yield (words[i], words[i+1], words[i+2])

    model = defaultdict(list)
    directory = 'training_sets'
    for f in [ f for f in listdir(directory) if isfile(join(directory,f)) ]:
        with open(join(directory,f)) as w:
            print f
            for words in trigram(nltk.PunktWordTokenizer().tokenize(w.read().decode("latin-1"))):
                if len(word_set.intersection(words)) == 3:
                    model[words[0], words[1]].append(words[2])
    pickle.dump(model, open( "model.pickle", "wb" ) )


def full_permutations():
    def sentence(words, tup, max=45):
        for e in set(model[tup]):
            new_words = words + ' '+ e
            if len(new_words) < 45:
                print new_words
                sentence(new_words, (tup[1], e))

    for p in permutations(word_list, 2):
        sentence(p[0], p)


def random_sentence():
    def sentence(words, tup, max=45):
        words += ' '+ tup[1]
        if len(words) > 45 or tup not in model:
            return words
        return sentence(words, (tup[1], choice(model[tup])))

    start = choice(model.keys())
    return sentence(start[0], start)

for i in range(100):
    print random_sentence()
