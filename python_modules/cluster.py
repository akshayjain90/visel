import sys
import os
import json

from sklearn import datasets
from sklearn import metrics
from sklearn.tree import DecisionTreeClassifier
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.preprocessing import scale
from sklearn.datasets import load_digits

import numpy as np
from time import time
import matplotlib.pyplot as plt

def bench_k_means(estimator, name, data):
    t0 = time()
    labels= ['A','B','C','D','E']
    estimator.fit(data)
    print('% 9s   %.2fs    %i' % (name, (time() - t0), estimator.inertia_))


if __name__ == "__main__":

    data_file = open("../data/"+sys.argv[1],'r')

    lines = data_file.read().splitlines()
    data = []

    for row in lines:
        data.append(map(float,row.split("\t")))

    np_data = scale(np.array(data))

    n_samples, n_features = np_data.shape

    bench_k_means(KMeans(init='k-means++', n_clusters=5, n_init=10),
                  name="test clustering", data=np_data)

    num_clusters = 5
    kmeans = KMeans(init='k-means++', n_clusters=num_clusters, n_init=1000, n_jobs =-1)
    kmeans.fit(np_data)

    h=0.002

    # Plot the decision boundary. For that, we will assign a color to each
    x_min, x_max = np_data[:, 0].min() , np_data[:, 0].max()
    y_min, y_max = np_data[:, 1].min() , np_data[:, 1].max()
    xx, yy = np.meshgrid(np.arange(x_min, x_max, h), np.arange(y_min, y_max, h))

    # Obtain labels for each point in mesh. Use last trained model.
    Z = kmeans.predict(np.c_[xx.ravel(), yy.ravel()])

    # Put the result into a color plot
    Z = Z.reshape(xx.shape)
    plt.figure(1)
    plt.clf()
    plt.imshow(Z, interpolation='nearest',
               extent=(xx.min(), xx.max(), yy.min(), yy.max()),
               cmap=plt.cm.Paired,
               aspect='auto', origin='lower')

    plt.plot(np_data[:, 0], np_data[:, 1], 'k.', markersize=2)
    # Plot the centroids as a white X
    centroids = kmeans.cluster_centers_
    print centroids
    plt.scatter(centroids[:, 0], centroids[:, 1],
                marker='x', s=169, linewidths=3,
                color='w', zorder=10)
    plt.title('test clustering results')
    plt.xlim(x_min, x_max)
    plt.ylim(y_min, y_max)
    plt.xticks(())
    plt.yticks(())
    plt.show()

    data_file.close()
