__author__ = 'Akshay'

import sys
import os
import json

import numpy as np

if __name__ == "__main__":

    if len(sys.argv) < 4:
        print "Usage : python generate_data.py <filename> <num of rows> <num of columns> <number of top level clusters>"
        exit()

    count =0

    while os.path.isfile("../data/"+sys.argv[1]+"_"+str(count)):
        count+=1

    data_file = open("../data/"+sys.argv[1]+"_"+str(count),'w')
    #data = np.random.rand(int(sys.argv[2]),int(sys.argv[3]))

    rows = int(sys.argv[2])
    cols = int(sys.argv[3])
    clusters = int(sys.argv[4])

    x,y = [],[]

    mu, sigma = 0,1000

    for i in range(0,clusters):
        s = np.random.normal(mu, sigma, (rows/clusters,2))

        for j in s:
            data_file.write("\t".join(map(str,j*100)))
            data_file.write("\n")
        mu = np.random.randint(100,10000)
        sigma = np.random.randint(100,1000)

        x.extend(s[:,0])
        y.extend(s[:,1])


    import matplotlib.pyplot as plt
    plt.scatter(x,y, c=y  , s=500)
    #plt.plot(bins, 1/(sigma * np.sqrt(2 * np.pi)) * np.exp( - (bins - mu)**2 / (2 * sigma**2) ),
    #        linewidth=2, color='r')
    plt.show()


    '''for row in data:

        data_file.write("\t".join(map(str,row*100)))
            #data_file.write("\t")

        data_file.write("\n")
    '''
    data_file.close()

